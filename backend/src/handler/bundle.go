package handler

import (
	"errors"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type BundleHandler struct {
	usecase usecase.BundleUsecase
}

func NewBundleHandler(uc usecase.BundleUsecase) *BundleHandler {
	return &BundleHandler{usecase: uc}
}

// RequestBundle godoc
// @Summary Ask to download everything of a class
// @Description Students accepted into the tutorial, and only when the tutor turned on downloads (show_download). The package (a summary PDF plus a folder of files per meeting, zipped) is checked by a background job and the student is notified when it is ready; poll GET /me/bundles/{id}. The zip is never stored. An unfinished or still-valid request is returned instead of a new one (200 instead of 202).
// @Tags bundle
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Success 202 {object} dto.RequestResponse
// @Success 200 {object} dto.RequestResponse
// @Failure 403 {string} string "Not a student, or downloads are off"
// @Failure 404 {string} string "Tutorial not found"
// @Router /me/tutorials/{id}/bundle [post]
func (h *BundleHandler) RequestBundle(c *gin.Context) {
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	resp, created, err := h.usecase.Request(c.Request.Context(), userID, c.GetString("role"), c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to start the download")
		return
	}

	status := http.StatusOK
	if created {
		status = http.StatusAccepted
	}
	response.Response{StatusCode: status, Success: true, Message: "Download requested", Data: resp}.Send(c)
}

// BundleStatus godoc
// @Summary Check a download request
// @Description Status is queued, preparing, ready, failed or expired. When ready, download_url is a short-lived link (10 minutes) that is renewed on every call.
// @Tags bundle
// @Security JwtAuth
// @Produce json
// @Param id path string true "Request ID"
// @Success 200 {object} dto.RequestResponse
// @Failure 404 {string} string "Not found"
// @Router /me/bundles/{id} [get]
func (h *BundleHandler) BundleStatus(c *gin.Context) {
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	resp, err := h.usecase.Status(userID, c.Param("id"))
	if err != nil {
		h.fail(c, err, "Failed to read the download")
		return
	}

	response.NewSuccessResponse("Download status", resp).Send(c)
}

// DownloadBundle godoc
// @Summary Download the zip
// @Description Opened by the browser from download_url, so it takes a signed token instead of a login. The zip is built while it is sent, straight from storage; nothing is saved on the server.
// @Tags bundle
// @Produce application/zip
// @Param id path string true "Request ID"
// @Param token query string true "Token from download_url"
// @Success 200 {file} file
// @Failure 403 {string} string "Invalid or expired link"
// @Router /bundles/{id}/download [get]
func (h *BundleHandler) DownloadBundle(c *gin.Context) {
	requestID, userID, err := h.usecase.Authorize(c.Query("token"))
	if err != nil || requestID.String() != c.Param("id") {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", usecase.ErrBadToken.Error()).Send(c)
		return
	}

	pkg, err := h.usecase.Open(requestID, userID)
	if err != nil {
		h.fail(c, err, "Failed to prepare the download")
		return
	}

	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=\"materials.zip\"; filename*=UTF-8''"+url.PathEscape(pkg.FileName))
	c.Header("Cache-Control", "no-store")
	c.Header("X-Accel-Buffering", "no") // let a reverse proxy pass the stream through
	c.Status(http.StatusOK)

	// from here the status line is sent: a failure can only cut the stream short
	if err := pkg.Write(c.Request.Context(), c.Writer); err != nil {
		log.Printf("bundle: streaming request %s stopped: %v", requestID, err)
	}
}

func (h *BundleHandler) userID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return uuid.Nil, false
	}
	return id, true
}

func (h *BundleHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrForbidden), errors.Is(err, usecase.ErrDownloadsOff):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrNotReady):
		response.NewErrorResponse(http.StatusConflict, "Not ready", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrQueueDown):
		response.NewErrorResponse(http.StatusServiceUnavailable, "Unavailable", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
