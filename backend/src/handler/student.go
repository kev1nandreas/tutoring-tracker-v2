package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type StudentHandler struct {
	usecase usecase.StudentUsecase
}

func NewStudentHandler(uc usecase.StudentUsecase) *StudentHandler {
	return &StudentHandler{usecase: uc}
}

func (h *StudentHandler) studentError(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrForbidden):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Student not found", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}

// FindStudents godoc
// @Summary List my students across all my tutorials
// @Description Tutors only. Users accepted into any tutorial the tutor created, one row per student. q matches name, username, email or school.
// @Tags student
// @Security JwtAuth
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param q query string false "Search name, username, email or school"
// @Success 200 {array} dto.StudentRow
// @Failure 403 {string} string "Only tutors"
// @Router /students [get]
func (h *StudentHandler) FindStudents(c *gin.Context) {
	uid, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}
	params := pagination.ParseParams(c)
	items, meta, err := h.usecase.List(uid, c.GetString("role"), params.Filters["q"], params)
	if err != nil {
		h.studentError(c, err, "Failed to retrieve students")
		return
	}
	response.NewPaginatedResponse("Students retrieved successfully", items, meta).Send(c)
}

// FindStudent godoc
// @Summary Student detail with progress in each of my tutorials
// @Description Tutors only. The user must have a request in at least one tutorial the tutor created. Per tutorial: enrollment status, meetings, attendance, homework and average grade.
// @Tags student
// @Security JwtAuth
// @Produce json
// @Param id path string true "Student user ID"
// @Success 200 {object} dto.StudentDetail
// @Failure 404 {string} string "Not found"
// @Router /students/{id} [get]
func (h *StudentHandler) FindStudent(c *gin.Context) {
	uid, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}
	out, err := h.usecase.Detail(uid, c.GetString("role"), c.Param("id"))
	if err != nil {
		h.studentError(c, err, "Failed to retrieve student")
		return
	}
	response.NewSuccessResponse("Student retrieved successfully", out).Send(c)
}
