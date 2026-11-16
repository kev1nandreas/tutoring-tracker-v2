package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type SubmissionHandler struct {
	usecase usecase.SubmissionUsecase
}

func NewSubmissionHandler(uc usecase.SubmissionUsecase) *SubmissionHandler {
	return &SubmissionHandler{usecase: uc}
}

// FindSubmissionsByMeeting godoc
// @Summary List submissions of a meeting with pagination
// @Description Includes the submitting user (id, name, username, school), grade and feedback. A student only sees their own submissions; a tutor only those of their own tutorials; an admin sees all.
// @Tags submission
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} dto.SubmissionResponse
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/submissions [get]
func (h *SubmissionHandler) FindSubmissionsByMeeting(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	params := pagination.ParseParams(c)
	items, meta, err := h.usecase.FindByMeetingID(c.Param("id"), callerID, c.GetString("role"), params)
	if err != nil {
		h.fail(c, err, "Failed to retrieve submissions")
		return
	}

	response.NewPaginatedResponse("Submissions retrieved successfully", items, meta).Send(c)
}

// CreateSubmission godoc
// @Summary Add a submission to a meeting
// @Description The submitting user is taken from the JWT.
// @Tags submission
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.CreateSubmissionRequest true "Create submission"
// @Success 201 {object} dto.SubmissionResponse
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/submissions [post]
func (h *SubmissionHandler) CreateSubmission(c *gin.Context) {
	var input dto.CreateSubmissionRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	item, err := h.usecase.Create(c.Param("id"), callerID, input)
	if err != nil {
		h.fail(c, err, "Failed to create submission")
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Submission created successfully",
		Data:       item,
	}.Send(c)
}

// DeleteSubmission godoc
// @Summary Delete a submission by ID
// @Description Only the user who made the submission.
// @Tags submission
// @Security JwtAuth
// @Produce json
// @Param id path string true "Submission ID"
// @Success 204 {string} string "Deleted"
// @Failure 403 {string} string "Not the owner"
// @Failure 404 {string} string "Not found"
// @Router /submissions/{id} [delete]
func (h *SubmissionHandler) DeleteSubmission(c *gin.Context) {
	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	if err := h.usecase.Delete(c.Param("id"), callerID); err != nil {
		h.fail(c, err, "Failed to delete submission")
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Submission deleted successfully",
		Data:       true,
	}.Send(c)
}

// GradeSubmission godoc
// @Summary Grade a submission
// @Description Sets grade (0-100) and feedback. Only the tutor of the meeting's tutorial, or an admin.
// @Tags submission
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Submission ID"
// @Param input body dto.GradeSubmissionRequest true "Grade and feedback"
// @Success 200 {object} dto.SubmissionResponse
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Not a tutor"
// @Failure 404 {string} string "Not found"
// @Router /submissions/{id}/grade [put]
func (h *SubmissionHandler) GradeSubmission(c *gin.Context) {
	var input dto.GradeSubmissionRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	callerID, ok := h.callerID(c)
	if !ok {
		return
	}

	item, err := h.usecase.Grade(c.Param("id"), callerID, c.GetString("role"), input)
	if err != nil {
		h.fail(c, err, "Failed to grade submission")
		return
	}

	response.NewSuccessResponse("Submission graded successfully", item).Send(c)
}

func (h *SubmissionHandler) callerID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return uuid.Nil, false
	}
	return id, true
}

func (h *SubmissionHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrMeetingNotFound), errors.Is(err, usecase.ErrSubmissionNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrForbidden), errors.Is(err, usecase.ErrGradeForbidden):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
