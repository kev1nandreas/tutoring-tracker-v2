package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type FeedbackHandler struct {
	usecase usecase.FeedbackUsecase
}

func NewFeedbackHandler(uc usecase.FeedbackUsecase) *FeedbackHandler {
	return &FeedbackHandler{usecase: uc}
}

func (h *FeedbackHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrEmptyAnswer):
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrClosed):
		response.NewErrorResponse(http.StatusForbidden, "Feedback is closed", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrAlreadySubmitted):
		response.NewErrorResponse(http.StatusConflict, "Already submitted", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}

// FormInfo godoc
// @Summary Public feedback form: tutorial details
// @Description No login needed. code is the tutorial code.
// @Tags feedback
// @Produce json
// @Param code path string true "Tutorial code"
// @Success 200 {object} dto.FormInfo
// @Failure 404 {string} string "Not found"
// @Router /public/feedback/{code} [get]
func (h *FeedbackHandler) FormInfo(c *gin.Context) {
	out, err := h.usecase.Info(c.Param("code"))
	if err != nil {
		h.fail(c, err, "Failed to load the form")
		return
	}
	response.NewSuccessResponse("Feedback form retrieved", out).Send(c)
}

// Submit godoc
// @Summary Public feedback form: send feedback
// @Description No login needed. Only works once the tutorial is done and its feedback switch is on. The email is only hashed to stop a second submission; answers are stored without it. A second submission with the same email returns 409.
// @Tags feedback
// @Accept json
// @Produce json
// @Param code path string true "Tutorial code"
// @Param input body dto.SubmitRequest true "Feedback"
// @Success 201 {boolean} bool "true"
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Feedback closed"
// @Failure 409 {string} string "Already submitted"
// @Router /public/feedback/{code} [post]
func (h *FeedbackHandler) Submit(c *gin.Context) {
	var input dto.SubmitRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}
	if err := h.usecase.Submit(c.Param("code"), input); err != nil {
		h.fail(c, err, "Failed to save feedback")
		return
	}
	response.Response{StatusCode: http.StatusCreated, Success: true, Message: "Thank you for your feedback", Data: true}.Send(c)
}

// Status godoc
// @Summary Must I send feedback before opening this tutorial?
// @Tags feedback
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Success 200 {object} dto.Status
// @Router /me/tutorials/{id}/feedback-status [get]
func (h *FeedbackHandler) Status(c *gin.Context) {
	uid, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}
	out, err := h.usecase.Status(c.Param("id"), uid, c.GetString("role"))
	if err != nil {
		h.fail(c, err, "Failed to check feedback")
		return
	}
	response.NewSuccessResponse("Feedback status retrieved", out).Send(c)
}

// Gate blocks a student's access to a finished tutorial until they sent its feedback.
func (h *FeedbackHandler) Gate() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("role") != "student" {
			return
		}
		uid, err := uuid.Parse(c.GetString("user_id"))
		if err != nil {
			return
		}
		st, err := h.usecase.Status(c.Param("id"), uid, "student")
		if err == nil && st.Required {
			response.NewErrorResponse(http.StatusForbidden, "Feedback required", "feedback_required").Send(c)
			c.Abort()
		}
	}
}

// Summary godoc
// @Summary Feedback of a tutorial (anonymous)
// @Description Tutors of the tutorial (or an admin). Answers only; who sent them is not stored.
// @Tags feedback
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Success 200 {object} dto.Summary
// @Failure 404 {string} string "Not found"
// @Router /tutorials/{id}/feedback [get]
func (h *FeedbackHandler) Summary(c *gin.Context) {
	uid, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}
	out, err := h.usecase.Summary(c.Param("id"), uid, c.GetString("role"))
	if err != nil {
		h.fail(c, err, "Failed to load feedback")
		return
	}
	response.NewSuccessResponse("Feedback retrieved", out).Send(c)
}
