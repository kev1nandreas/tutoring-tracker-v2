package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"go.mongodb.org/mongo-driver/mongo"
)

type NotificationHandler struct {
	usecase usecase.NotificationUsecase
}

func NewNotificationHandler(uc usecase.NotificationUsecase) *NotificationHandler {
	return &NotificationHandler{usecase: uc}
}

// FindNotificationsByUser godoc
// @Summary List notifications of a user with pagination
// @Description Paginated, newest first by default. Filter with ?is_read=true|false
// @Tags notification
// @Produce json
// @Param id path string true "User ID"
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Param is_read query bool false "Filter by read state"
// @Success 200 {array} entity.Notification
// @Router /users/{id}/notifications [get]
func (h *NotificationHandler) FindNotificationsByUser(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindByUserID(c.Param("id"), params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve notifications", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Notifications retrieved successfully", items, meta).Send(c)
}

// FindNotification godoc
// @Summary Get a notification by ID
// @Tags notification
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} entity.Notification
// @Failure 404 {string} string "Not found"
// @Router /notifications/{id} [get]
func (h *NotificationHandler) FindNotification(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Notification retrieved successfully", item).Send(c)
}

// MarkNotificationAsRead godoc
// @Summary Mark a notification as read
// @Tags notification
// @Security JwtAuth
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} entity.Notification
// @Failure 404 {string} string "Not found"
// @Router /notifications/{id}/read [patch]
func (h *NotificationHandler) MarkNotificationAsRead(c *gin.Context) {
	item, err := h.usecase.MarkAsRead(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Notification marked as read", item).Send(c)
}

func (h *NotificationHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, mongo.ErrNoDocuments) {
		response.NewErrorResponse(http.StatusNotFound, "Notification not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process notification", err.Error()).Send(c)
}
