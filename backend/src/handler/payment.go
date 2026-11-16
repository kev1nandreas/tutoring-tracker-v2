package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	usecase usecase.PaymentUsecase
}

func NewPaymentHandler(uc usecase.PaymentUsecase) *PaymentHandler {
	return &PaymentHandler{usecase: uc}
}

// FindPayments godoc
// @Summary List payments with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags payment
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Description A tutor only gets payments of tutorials they created.
// @Success 200 {array} dto.PaymentResponse
// @Router /payments [get]
func (h *PaymentHandler) FindPayments(c *gin.Context) {
	tutorID, ok := h.tutorScope(c)
	if !ok {
		return
	}
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params, tutorID)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve payments", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Payments retrieved successfully", items, meta).Send(c)
}

// CreatePayment godoc
// @Summary Create a payment
// @Tags payment
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.CreatePaymentRequest true "Create payment"
// @Success 201 {object} dto.PaymentResponse
// @Failure 400 {string} string "Bad Request"
// @Router /payments [post]
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var input dto.CreatePaymentRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	tutorID, ok := h.tutorScope(c)
	if !ok {
		return
	}

	item, err := h.usecase.Create(input, tutorID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", err.Error()).Send(c)
			return
		}
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to create payment", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Payment created successfully",
		Data:       item,
	}.Send(c)
}

// FindPayment godoc
// @Summary Get a payment by ID
// @Tags payment
// @Produce json
// @Param id path string true "Payment ID"
// @Success 200 {object} dto.PaymentResponse
// @Failure 404 {string} string "Not found"
// @Router /payments/{id} [get]
func (h *PaymentHandler) FindPayment(c *gin.Context) {
	tutorID, ok := h.tutorScope(c)
	if !ok {
		return
	}
	item, err := h.usecase.FindByID(c.Param("id"), tutorID)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Payment retrieved successfully", item).Send(c)
}

// UpdatePayment godoc
// @Summary Update a payment by ID
// @Tags payment
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Payment ID"
// @Param input body dto.UpdatePaymentRequest true "Update payment"
// @Success 200 {object} dto.PaymentResponse
// @Failure 404 {string} string "Not found"
// @Router /payments/{id} [put]
func (h *PaymentHandler) UpdatePayment(c *gin.Context) {
	var input dto.UpdatePaymentRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	tutorID, ok := h.tutorScope(c)
	if !ok {
		return
	}

	item, err := h.usecase.Update(c.Param("id"), tutorID, input)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Payment updated successfully", item).Send(c)
}

// DeletePayment godoc
// @Summary Delete a payment by ID
// @Tags payment
// @Security JwtAuth
// @Produce json
// @Param id path string true "Payment ID"
// @Success 204 {string} string "Deleted"
// @Failure 404 {string} string "Not found"
// @Router /payments/{id} [delete]
func (h *PaymentHandler) DeletePayment(c *gin.Context) {
	tutorID, ok := h.tutorScope(c)
	if !ok {
		return
	}
	if err := h.usecase.Delete(c.Param("id"), tutorID); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Payment deleted successfully",
		Data:       true,
	}.Send(c)
}

// tutorScope returns the caller's id when they are a tutor, so lookups are limited
// to tutorials they created. Other roles get nil (no limit).
func (h *PaymentHandler) tutorScope(c *gin.Context) (*uuid.UUID, bool) {
	if c.GetString("role") != "tutor" {
		return nil, true
	}
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return nil, false
	}
	return &id, true
}

func (h *PaymentHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "Payment not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process payment", err.Error()).Send(c)
}
