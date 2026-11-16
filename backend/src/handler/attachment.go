package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type AttachmentHandler struct {
	usecase usecase.AttachmentUsecase
}

func NewAttachmentHandler(uc usecase.AttachmentUsecase) *AttachmentHandler {
	return &AttachmentHandler{usecase: uc}
}

// FindAttachmentsByMeeting godoc
// @Summary List the files of a meeting
// @Description A tutor sees files of their own tutorials. A student sees them when accepted into the tutorial. Types: ppt, picture, book, video, other. The storage key is never returned.
// @Tags attachment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} dto.AttachmentResponse
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attachments [get]
func (h *AttachmentHandler) FindAttachmentsByMeeting(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	items, meta, err := h.usecase.FindByMeetingID(c.Param("id"), callerID, c.GetString("role"), pagination.ParseParams(c))
	if err != nil {
		h.fail(c, err, "Failed to retrieve attachments")
		return
	}

	response.NewPaginatedResponse("Attachments retrieved successfully", items, meta).Send(c)
}

// CreateUploadTicket godoc
// @Summary Get a ticket to upload a file to a meeting
// @Description Tutor of the tutorial (or admin). Validates type, extension and size, then returns a MinIO form target: POST multipart/form-data to upload_url with every entry of fields first, then the file under the field "file". MinIO enforces the size limit. Finish with POST /meetings/{id}/attachments/complete.
// @Tags attachment
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.UploadTicketRequest true "File name, type and size"
// @Success 200 {object} dto.UploadTicket
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attachments/upload-url [post]
func (h *AttachmentHandler) CreateUploadTicket(c *gin.Context) {
	var input dto.UploadTicketRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	ticket, err := h.usecase.PrepareUpload(c.Request.Context(), c.Param("id"), callerID, c.GetString("role"), input)
	if err != nil {
		h.fail(c, err, "Failed to prepare the upload")
		return
	}

	response.NewSuccessResponse("Upload ticket created", ticket).Send(c)
}

// CompleteUploads godoc
// @Summary Save files that were uploaded with a ticket
// @Description Tutor of the tutorial (or admin). Checks every file exists in storage, keeps its real size, saves all or nothing and notifies the students.
// @Tags attachment
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.CompleteUploadsRequest true "Uploaded files"
// @Success 201 {array} dto.AttachmentResponse
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attachments/complete [post]
func (h *AttachmentHandler) CompleteUploads(c *gin.Context) {
	var input dto.CompleteUploadsRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	items, err := h.usecase.CompleteUploads(c.Request.Context(), c.Param("id"), callerID, c.GetString("role"), input)
	if err != nil {
		h.fail(c, err, "Failed to save the files")
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Files saved successfully",
		Data:       items,
	}.Send(c)
}

// DownloadAttachment godoc
// @Summary Get a short-lived link to open or download a file
// @Description Same access as listing the files. With ?inline=true, images, video and PDF are returned to be shown in the browser; everything else is a download.
// @Tags attachment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Attachment ID"
// @Param inline query bool false "Show in the browser when possible"
// @Success 200 {object} dto.DownloadResponse
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Not found"
// @Router /attachments/{id}/download [get]
func (h *AttachmentHandler) DownloadAttachment(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	out, err := h.usecase.DownloadURL(c.Request.Context(), c.Param("id"), callerID, c.GetString("role"), c.Query("inline") == "true")
	if err != nil {
		h.fail(c, err, "Failed to create the link")
		return
	}

	response.NewSuccessResponse("Link created", out).Send(c)
}

// DeleteAttachment godoc
// @Summary Delete a file
// @Description Tutor of the tutorial (or admin). Also removes the stored file.
// @Tags attachment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Attachment ID"
// @Success 204 {string} string "Deleted"
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Not found"
// @Router /attachments/{id} [delete]
func (h *AttachmentHandler) DeleteAttachment(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), c.Param("id"), callerID, c.GetString("role")); err != nil {
		h.fail(c, err, "Failed to delete attachment")
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Attachment deleted successfully",
		Data:       true,
	}.Send(c)
}

func (h *AttachmentHandler) callerID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return uuid.Nil, false
	}
	return id, true
}

func (h *AttachmentHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrMeetingNotFound), errors.Is(err, usecase.ErrAttachmentNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrForbidden):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrBadRequest):
		response.NewErrorResponse(http.StatusBadRequest, "Bad Request", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
