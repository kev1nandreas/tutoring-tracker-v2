package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type PendingValidationHandler struct {
	usecase usecase.PendingValidationUsecase
}

func NewPendingValidationHandler(uc usecase.PendingValidationUsecase) *PendingValidationHandler {
	return &PendingValidationHandler{usecase: uc}
}

// FindPendingValidations godoc
// @Summary List pending validations with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags pending-validation
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.PendingValidation
// @Router /pending-validations [get]
func (h *PendingValidationHandler) FindPendingValidations(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve pending validations", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("PendingValidations retrieved successfully", items, meta).Send(c)
}

// CreatePendingValidation godoc
// @Summary Create a pending validation
// @Tags pending-validation
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.CreatePendingValidationRequest true "Create pending validation"
// @Success 201 {object} entity.PendingValidation
// @Failure 400 {string} string "Bad Request"
// @Router /pending-validations [post]
func (h *PendingValidationHandler) CreatePendingValidation(c *gin.Context) {
	var input dto.CreatePendingValidationRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Create(input)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to create pending validation", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "PendingValidation created successfully",
		Data:       item,
	}.Send(c)
}

// FindPendingValidation godoc
// @Summary Get a pending validation by ID
// @Tags pending-validation
// @Produce json
// @Param id path string true "PendingValidation ID"
// @Success 200 {object} entity.PendingValidation
// @Failure 404 {string} string "Not found"
// @Router /pending-validations/{id} [get]
func (h *PendingValidationHandler) FindPendingValidation(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("PendingValidation retrieved successfully", item).Send(c)
}

// UpdatePendingValidation godoc
// @Summary Update a pending validation by ID
// @Tags pending-validation
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "PendingValidation ID"
// @Param input body dto.UpdatePendingValidationRequest true "Update pending validation"
// @Success 200 {object} entity.PendingValidation
// @Failure 404 {string} string "Not found"
// @Router /pending-validations/{id} [put]
func (h *PendingValidationHandler) UpdatePendingValidation(c *gin.Context) {
	var input dto.UpdatePendingValidationRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Update(c.Param("id"), input)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("PendingValidation updated successfully", item).Send(c)
}

// DeletePendingValidation godoc
// @Summary Delete a pending validation by ID
// @Tags pending-validation
// @Security JwtAuth
// @Produce json
// @Param id path string true "PendingValidation ID"
// @Success 204 {string} string "Deleted"
// @Failure 404 {string} string "Not found"
// @Router /pending-validations/{id} [delete]
func (h *PendingValidationHandler) DeletePendingValidation(c *gin.Context) {
	if err := h.usecase.Delete(c.Param("id")); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "PendingValidation deleted successfully",
		Data:       true,
	}.Send(c)
}

func (h *PendingValidationHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "PendingValidation not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process pending validation", err.Error()).Send(c)
}
