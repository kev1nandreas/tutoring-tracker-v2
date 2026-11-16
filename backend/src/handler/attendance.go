package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type AttendanceHandler struct {
	usecase usecase.AttendanceUsecase
}

func NewAttendanceHandler(uc usecase.AttendanceUsecase) *AttendanceHandler {
	return &AttendanceHandler{usecase: uc}
}

// CreateUploadTicket godoc
// @Summary Get a ticket to upload an attendance photo
// @Description Students accepted into the class, only on the day of the meeting, and only when the tutorial's attendance switch (show_attendance) is on. Photo: .jpg, .png or .webp, at most 10 MB. Upload it with the returned form, then call POST /meetings/{id}/attendance.
// @Tags attendance
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.UploadTicketRequest true "File name and size"
// @Success 200 {object} dto.UploadTicket
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Attendance is off, or not the meeting day"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attendance/upload-url [post]
func (h *AttendanceHandler) CreateUploadTicket(c *gin.Context) {
	var input dto.UploadTicketRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	out, err := h.usecase.PrepareUpload(c.Request.Context(), c.Param("id"), userID, c.GetString("role"), input)
	if err != nil {
		h.fail(c, err, "Failed to prepare the upload")
		return
	}
	response.NewSuccessResponse("Upload ticket created", out).Send(c)
}

// MarkAttendance godoc
// @Summary Mark attendance with the uploaded photo
// @Description Same access as the upload ticket. Saves the photo as the student's check-in; a second photo replaces the first.
// @Tags attendance
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.MarkRequest true "Key of the uploaded photo"
// @Success 200 {object} dto.MyAttendance
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Attendance is off, or not the meeting day"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attendance [post]
func (h *AttendanceHandler) MarkAttendance(c *gin.Context) {
	var input dto.MarkRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	out, err := h.usecase.Mark(c.Request.Context(), c.Param("id"), userID, c.GetString("role"), input)
	if err != nil {
		h.fail(c, err, "Failed to mark attendance")
		return
	}
	response.NewSuccessResponse("Attendance marked", out).Send(c)
}

// MyAttendance godoc
// @Summary My attendance for a meeting
// @Description Students accepted into the class, when attendance is on. can_mark is true only on the meeting day.
// @Tags attendance
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Success 200 {object} dto.MyAttendance
// @Failure 403 {string} string "Attendance is off"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attendance/me [get]
func (h *AttendanceHandler) MyAttendance(c *gin.Context) {
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	out, err := h.usecase.Mine(c.Request.Context(), c.Param("id"), userID, c.GetString("role"))
	if err != nil {
		h.fail(c, err, "Failed to read attendance")
		return
	}
	response.NewSuccessResponse("Attendance retrieved", out).Send(c)
}

// Roster godoc
// @Summary Who attended a meeting
// @Description The tutor of the tutorial (or an admin), when attendance is on. Lists every accepted student with their check-in and a short-lived link to their photo.
// @Tags attendance
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Success 200 {object} dto.Roster
// @Failure 403 {string} string "Attendance is off"
// @Failure 404 {string} string "Meeting not found"
// @Router /meetings/{id}/attendance [get]
func (h *AttendanceHandler) Roster(c *gin.Context) {
	userID, ok := h.userID(c)
	if !ok {
		return
	}

	out, err := h.usecase.Roster(c.Request.Context(), c.Param("id"), userID, c.GetString("role"))
	if err != nil {
		h.fail(c, err, "Failed to read attendance")
		return
	}
	response.NewSuccessResponse("Attendance retrieved", out).Send(c)
}

func (h *AttendanceHandler) userID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return uuid.Nil, false
	}
	return id, true
}

func (h *AttendanceHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrMeetingNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrForbidden), errors.Is(err, usecase.ErrAttendanceOff), errors.Is(err, usecase.ErrNotToday):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrStorage):
		response.NewErrorResponse(http.StatusBadGateway, "File storage unavailable", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrBadRequest):
		response.NewErrorResponse(http.StatusBadRequest, "Bad Request", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
