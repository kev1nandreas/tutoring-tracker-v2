package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type PendingValidationHandler struct {
	usecase usecase.PendingValidationUsecase
}

func NewPendingValidationHandler(uc usecase.PendingValidationUsecase) *PendingValidationHandler {
	return &PendingValidationHandler{usecase: uc}
}

// caller reads the authenticated user from the JWT middleware.
func (h *PendingValidationHandler) caller(c *gin.Context) (uuid.UUID, string, bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return uuid.Nil, "", false
	}
	return id, c.GetString("role"), true
}

// Enroll godoc
// @Summary Enroll in a tutorial with its code
// @Description A student submits the tutorial code and waits as pending until the tutor validates.
// @Tags pending-validation
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.EnrollRequest true "Tutorial code"
// @Success 201 {object} entity.PendingValidation
// @Failure 403 {string} string "Only students"
// @Failure 404 {string} string "Tutorial not found"
// @Failure 409 {string} string "Already enrolled or pending"
// @Router /pending-validations/enroll [post]
func (h *PendingValidationHandler) Enroll(c *gin.Context) {
	var input dto.EnrollRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	callerID, role, ok := h.caller(c)
	if !ok {
		return
	}

	item, err := h.usecase.Enroll(callerID, role, input)
	if err != nil {
		h.fail(c, err, "Failed to enroll")
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Enrollment request sent, waiting for tutor validation",
		Data:       item,
	}.Send(c)
}

// FindMyEnrollments godoc
// @Summary List my enrollment requests and their status
// @Description Only students. Newest change first. status is pending, accepted or declined.
// @Tags pending-validation
// @Security JwtAuth
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {array} dto.MyEnrollment
// @Failure 403 {string} string "Only students"
// @Router /pending-validations/mine [get]
func (h *PendingValidationHandler) FindMyEnrollments(c *gin.Context) {
	callerID, role, ok := h.caller(c)
	if !ok {
		return
	}

	items, meta, err := h.usecase.FindMine(callerID, role, pagination.ParseParams(c))
	if err != nil {
		h.fail(c, err, "Failed to retrieve enrollments")
		return
	}

	response.NewPaginatedResponse("Enrollments retrieved successfully", items, meta).Send(c)
}

// FindPendingValidations godoc
// @Summary List enrollment requests of all my tutorials, grouped by tutorial
// @Description Only tutors. Covers only tutorials the caller created. Paginated over tutorials. Filter with ?is_validated=0|1|2 (0 pending, 1 accepted, 2 declined).
// @Tags pending-validation
// @Security JwtAuth
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param is_validated query int false "0 pending, 1 accepted, 2 declined"
// @Param q query string false "Search students by name, username or school"
// @Success 200 {array} dto.TutorialPendingGroup
// @Failure 403 {string} string "Only tutors"
// @Router /pending-validations [get]
func (h *PendingValidationHandler) FindPendingValidations(c *gin.Context) {
	callerID, role, ok := h.caller(c)
	if !ok {
		return
	}

	params := pagination.ParseParams(c)

	var status *int
	if raw, has := params.Filters["is_validated"]; has {
		v, err := strconv.Atoi(raw)
		if err != nil || v < 0 || v > 2 {
			response.NewErrorResponse(http.StatusBadRequest, "Invalid is_validated", "must be 0, 1 or 2").Send(c)
			return
		}
		status = &v
	}

	items, meta, err := h.usecase.FindGrouped(callerID, role, status, params.Filters["q"], params)
	if err != nil {
		h.fail(c, err, "Failed to retrieve pending validations")
		return
	}

	response.NewPaginatedResponse("Pending validations retrieved successfully", items, meta).Send(c)
}

// FindPendingValidationsByTutorial godoc
// @Summary List enrollment requests of a tutorial
// @Description Only the tutor who created the tutorial. Filter with ?is_validated=0|1|2 (0 pending, 1 accepted, 2 declined).
// @Tags pending-validation
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Param is_validated query int false "0 pending, 1 accepted, 2 declined"
// @Success 200 {array} dto.PendingStudent
// @Failure 403 {string} string "Not your tutorial"
// @Router /tutorials/{id}/pending-validations [get]
func (h *PendingValidationHandler) FindPendingValidationsByTutorial(c *gin.Context) {
	callerID, role, ok := h.caller(c)
	if !ok {
		return
	}

	params := pagination.ParseParams(c)
	items, meta, err := h.usecase.FindByTutorial(callerID, role, c.Param("id"), params)
	if err != nil {
		h.fail(c, err, "Failed to retrieve pending validations")
		return
	}

	response.NewPaginatedResponse("Pending validations retrieved successfully", items, meta).Send(c)
}

// Validate godoc
// @Summary Accept or decline students in bulk
// @Description Only the tutor who created the tutorial. Only students still pending are changed; others are returned in "skipped".
// @Tags pending-validation
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.ValidateRequest true "Tutorial code, student user ids and action (accept or decline)"
// @Success 200 {object} dto.ValidateResponse
// @Failure 403 {string} string "Not your tutorial"
// @Failure 404 {string} string "Tutorial not found"
// @Router /pending-validations/validate [post]
func (h *PendingValidationHandler) Validate(c *gin.Context) {
	var input dto.ValidateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	callerID, role, ok := h.caller(c)
	if !ok {
		return
	}

	result, err := h.usecase.Validate(callerID, role, input)
	if err != nil {
		h.fail(c, err, "Failed to validate")
		return
	}

	response.NewSuccessResponse("Validation processed", result).Send(c)
}

func (h *PendingValidationHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrForbidden):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrAlreadyEnrolled):
		response.NewErrorResponse(http.StatusConflict, "Conflict", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrTutorialDone):
		response.NewErrorResponse(http.StatusBadRequest, "Bad Request", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
