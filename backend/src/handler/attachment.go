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
// @Summary List attachments of a meeting with pagination
// @Tags attachment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Attachment
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attachments [get]
func (h *AttachmentHandler) FindAttachmentsByMeeting(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindByMeetingID(c.Param("id"), params)
	if err != nil {
		h.fail(c, err, "Failed to retrieve attachments")
		return
	}

	response.NewPaginatedResponse("Attachments retrieved successfully", items, meta).Send(c)
}

// CreateAttachments godoc
// @Summary Add one or many attachments to a meeting
// @Description Up to 50 per request, saved all or nothing. The creator is taken from the JWT.
// @Tags attachment
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.CreateAttachmentsRequest true "Attachments"
// @Success 201 {array} entity.Attachment
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attachments [post]
func (h *AttachmentHandler) CreateAttachments(c *gin.Context) {
	var input dto.CreateAttachmentsRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	creatorID, ok := h.callerID(c)
	if !ok {
		return
	}

	items, err := h.usecase.CreateBatch(c.Param("id"), creatorID, input)
	if err != nil {
		h.fail(c, err, "Failed to create attachments")
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Attachments created successfully",
		Data:       items,
	}.Send(c)
}

// DeleteAttachment godoc
// @Summary Delete an attachment
// @Description Only the user who created the attachment.
// @Tags attachment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Attachment ID"
// @Success 204 {string} string "Deleted"
// @Failure 403 {string} string "Not the creator"
// @Failure 404 {string} string "Not found"
// @Router /attachments/{id} [delete]
func (h *AttachmentHandler) DeleteAttachment(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	if err := h.usecase.Delete(c.Param("id"), callerID); err != nil {
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
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
