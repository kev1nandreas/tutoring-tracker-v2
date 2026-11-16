package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/scheduleimport"
	"gorm.io/gorm"
)

type MeetingHandler struct {
	usecase usecase.MeetingUsecase
}

func NewMeetingHandler(uc usecase.MeetingUsecase) *MeetingHandler {
	return &MeetingHandler{usecase: uc}
}

// FindMeetings godoc
// @Summary List meetings with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags meeting
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Meeting
// @Router /meetings [get]
func (h *MeetingHandler) FindMeetings(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve meetings", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Meetings retrieved successfully", items, meta).Send(c)
}

// FindMeetingsByTutorial godoc
// @Summary List meetings of a tutorial with pagination
// @Tags meeting
// @Produce json
// @Param id path string true "Tutorial ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Meeting
// @Router /tutorials/{id}/meetings [get]
func (h *MeetingHandler) FindMeetingsByTutorial(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindByTutorialID(c.Param("id"), params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve meetings", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Meetings retrieved successfully", items, meta).Send(c)
}

// FindMyTutorialMeetings godoc
// @Summary List meetings of a tutorial I was accepted into
// @Description Only students accepted into the tutorial (others get 404). The tutor's private notes are left out, and the recording is returned as a YouTube video id (video_id), not a link.
// @Tags meeting
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} dto.StudentMeeting
// @Failure 403 {string} string "Only students"
// @Failure 404 {string} string "Not found"
// @Router /me/tutorials/{id}/meetings [get]
func (h *MeetingHandler) FindMyTutorialMeetings(c *gin.Context) {
	if c.GetString("role") != "student" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "only students use this endpoint").Send(c)
		return
	}
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}

	tutorialID := c.Param("id")
	if _, err := uuid.Parse(tutorialID); err != nil {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "record not found").Send(c)
		return
	}
	ok, err := h.usecase.IsAcceptedStudent(tutorialID, userID)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve meetings", err.Error()).Send(c)
		return
	}
	if !ok {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "record not found").Send(c)
		return
	}

	items, meta, err := h.usecase.FindByTutorialID(tutorialID, pagination.ParseParams(c))
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve meetings", err.Error()).Send(c)
		return
	}
	out := make([]dto.StudentMeeting, len(items))
	for i, m := range items {
		out[i] = dto.ToStudentMeeting(m)
	}

	response.NewPaginatedResponse("Meetings retrieved successfully", out, meta).Send(c)
}

// CreateMeeting godoc
// @Summary Create a meeting
// @Description Only the tutor who created the tutorial (or an admin) can add meetings. date is YYYY-MM-DD; time_start and time_end are HH:MM in the app timezone.
// @Tags meeting
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.CreateMeetingRequest true "Create meeting"
// @Success 201 {object} entity.Meeting
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Forbidden"
// @Router /meetings [post]
func (h *MeetingHandler) CreateMeeting(c *gin.Context) {
	var input dto.CreateMeetingRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	if !h.canManageTutorial(c, input.TutorialID.String()) {
		return
	}

	item, err := h.usecase.Create(input)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidTimeRange) {
			response.NewErrorResponse(http.StatusBadRequest, "Invalid time range", err.Error()).Send(c)
			return
		}
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to create meeting", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Meeting created successfully",
		Data:       item,
	}.Send(c)
}

// maxImportBytes caps an uploaded schedule file.
const maxImportBytes = 1 << 20

// ScheduleTemplate godoc
// @Summary Download the schedule import template (.xlsx)
// @Description Columns: Date, Time range, Material (title)
// @Tags meeting
// @Security JwtAuth
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Success 200 {file} file
// @Router /schedule-import/template [get]
func (h *MeetingHandler) ScheduleTemplate(c *gin.Context) {
	data, err := scheduleimport.Template(time.Now())
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Could not build the template", err.Error()).Send(c)
		return
	}
	c.Header("Content-Disposition", `attachment; filename="schedule-template.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)
}

// ImportSchedule godoc
// @Summary Import a tutorial's schedule from an Excel file
// @Description Upload the filled template (field "file"). All rows are checked first: if any row is wrong nothing is created and the wrong rows are listed in data.errors (422).
// @Tags meeting
// @Security JwtAuth
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "Tutorial ID"
// @Param file formData file true "The .xlsx file"
// @Success 201 {object} map[string]int
// @Failure 400 {string} string "Bad file"
// @Failure 422 {string} string "Rows with problems"
// @Router /tutorials/{id}/meetings/import [post]
func (h *MeetingHandler) ImportSchedule(c *gin.Context) {
	tutorialID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "invalid id").Send(c)
		return
	}
	if !h.canManageTutorial(c, tutorialID.String()) {
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxImportBytes+4096)
	file, err := c.FormFile("file")
	if err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Choose an .xlsx file (max 1 MB)", err.Error()).Send(c)
		return
	}
	if file.Size > maxImportBytes || !strings.HasSuffix(strings.ToLower(file.Filename), ".xlsx") {
		response.NewErrorResponse(http.StatusBadRequest, "Upload an .xlsx file of at most 1 MB", "bad file").Send(c)
		return
	}
	src, err := file.Open()
	if err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Could not read the file", err.Error()).Send(c)
		return
	}
	defer src.Close()

	rows, rowErrs, err := scheduleimport.Parse(src)
	if err != nil {
		response.NewErrorResponse(http.StatusBadRequest, err.Error(), err.Error()).Send(c)
		return
	}

	if len(rowErrs) == 0 {
		var created int
		created, rowErrs, err = h.usecase.ImportSchedule(tutorialID, rows)
		if err != nil {
			response.NewErrorResponse(http.StatusInternalServerError, "Failed to import the schedule", err.Error()).Send(c)
			return
		}
		if len(rowErrs) == 0 {
			response.Response{
				StatusCode: http.StatusCreated,
				Success:    true,
				Message:    fmt.Sprintf("%d meetings imported", created),
				Data:       gin.H{"created": created},
			}.Send(c)
			return
		}
	}

	response.Response{
		StatusCode: http.StatusUnprocessableEntity,
		Success:    false,
		Message:    "Nothing was imported. Fix the rows below and upload again",
		Data:       gin.H{"errors": rowErrs},
	}.Send(c)
}

// FindMeeting godoc
// @Summary Get a meeting by ID
// @Tags meeting
// @Produce json
// @Param id path string true "Meeting ID"
// @Success 200 {object} entity.Meeting
// @Failure 404 {string} string "Not found"
// @Router /meetings/{id} [get]
func (h *MeetingHandler) FindMeeting(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Meeting retrieved successfully", item).Send(c)
}

// UpdateMeeting godoc
// @Summary Update a meeting by ID
// @Description Only the tutor who created the tutorial (or an admin) can update its meetings.
// @Tags meeting
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Meeting ID"
// @Param input body dto.UpdateMeetingRequest true "Update meeting"
// @Success 200 {object} entity.Meeting
// @Failure 404 {string} string "Not found"
// @Router /meetings/{id} [put]
func (h *MeetingHandler) UpdateMeeting(c *gin.Context) {
	var input dto.UpdateMeetingRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	if !h.canManageMeeting(c) {
		return
	}

	item, err := h.usecase.Update(c.Param("id"), input)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidTimeRange) {
			response.NewErrorResponse(http.StatusBadRequest, "Invalid time range", err.Error()).Send(c)
			return
		}
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Meeting updated successfully", item).Send(c)
}

// DeleteMeeting godoc
// @Summary Delete a meeting by ID
// @Description Only the tutor who created the tutorial (or an admin) can delete its meetings.
// @Tags meeting
// @Security JwtAuth
// @Produce json
// @Param id path string true "Meeting ID"
// @Success 204 {string} string "Deleted"
// @Failure 404 {string} string "Not found"
// @Router /meetings/{id} [delete]
func (h *MeetingHandler) DeleteMeeting(c *gin.Context) {
	if !h.canManageMeeting(c) {
		return
	}

	if err := h.usecase.Delete(c.Param("id")); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Meeting deleted successfully",
		Data:       true,
	}.Send(c)
}

// canManageTutorial lets only the creating tutor, or an admin, change a tutorial's
// meetings. It writes the error response itself and returns false when denied.
func (h *MeetingHandler) canManageTutorial(c *gin.Context, tutorialID string) bool {
	role := c.GetString("role")
	if role == "admin" {
		return true
	}
	if role != "tutor" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "only a tutor can change meetings").Send(c)
		return false
	}

	creator, err := h.usecase.TutorialCreator(tutorialID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", err.Error()).Send(c)
			return false
		}
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to process meeting", err.Error()).Send(c)
		return false
	}
	// someone else's tutorial looks the same as a missing one
	if creator == nil || creator.String() != c.GetString("user_id") {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "record not found").Send(c)
		return false
	}
	return true
}

// canManageMeeting is canManageTutorial for the tutorial that owns meeting :id.
func (h *MeetingHandler) canManageMeeting(c *gin.Context) bool {
	if c.GetString("role") == "admin" {
		return true
	}
	if c.GetString("role") != "tutor" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "only a tutor can change meetings").Send(c)
		return false
	}

	meeting, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return false
	}
	return h.canManageTutorial(c, meeting.TutorialID.String())
}

func (h *MeetingHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "Meeting not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process meeting", err.Error()).Send(c)
}
