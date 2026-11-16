package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type TutorialHandler struct {
	usecase usecase.TutorialUsecase
}

func NewTutorialHandler(uc usecase.TutorialUsecase) *TutorialHandler {
	return &TutorialHandler{usecase: uc}
}

// FindTutorials godoc
// @Summary List tutorials with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>. When called with a tutor token, only that tutor's own tutorials are returned.
// @Tags tutorial
// @Security JwtAuth
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Tutorial
// @Router /tutorials [get]
func (h *TutorialHandler) FindTutorials(c *gin.Context) {
	params := pagination.ParseParams(c)

	// a tutor only sees tutorials they created
	var creatorID *uuid.UUID
	if c.GetString("role") == "tutor" {
		id, err := uuid.Parse(c.GetString("user_id"))
		if err != nil {
			response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
			return
		}
		creatorID = &id
	}

	items, meta, err := h.usecase.FindAll(params, creatorID)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve tutorials", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Tutorials retrieved successfully", items, meta).Send(c)
}

// CreateTutorial godoc
// @Summary Create a tutorial
// @Tags tutorial
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.CreateTutorialRequest true "Create tutorial"
// @Success 201 {object} entity.Tutorial
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Forbidden"
// @Router /tutorials [post]
func (h *TutorialHandler) CreateTutorial(c *gin.Context) {
	var input dto.CreateTutorialRequest

	if c.GetString("role") != "tutor" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "only a tutor can create a tutorial").Send(c)
		return
	}
	creatorID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Create(creatorID, input)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to create tutorial", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Tutorial created successfully",
		Data:       item,
	}.Send(c)
}

// FindTutorial godoc
// @Summary Get a tutorial by ID
// @Description A tutor token can only read tutorials the tutor created.
// @Tags tutorial
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Success 200 {object} entity.Tutorial
// @Failure 404 {string} string "Not found"
// @Router /tutorials/{id} [get]
func (h *TutorialHandler) FindTutorial(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	// a tutor cannot see tutorials created by someone else
	if c.GetString("role") == "tutor" && (item.CreatedBy == nil || item.CreatedBy.String() != c.GetString("user_id")) {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "record not found").Send(c)
		return
	}

	response.NewSuccessResponse("Tutorial retrieved successfully", item).Send(c)
}

// UpdateTutorial godoc
// @Summary Update a tutorial by ID
// @Description Only the tutor who created the tutorial (or an admin) can update it.
// @Tags tutorial
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Tutorial ID"
// @Param input body dto.UpdateTutorialRequest true "Update tutorial"
// @Success 200 {object} entity.Tutorial
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Not found"
// @Router /tutorials/{id} [put]
func (h *TutorialHandler) UpdateTutorial(c *gin.Context) {
	var input dto.UpdateTutorialRequest

	if !h.canManage(c) {
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Update(c.Param("id"), input)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Tutorial updated successfully", item).Send(c)
}

// DeleteTutorial godoc
// @Summary Delete a tutorial by ID
// @Description Only the tutor who created the tutorial (or an admin) can delete it. Fails with 409 while it still has meetings, payments or students.
// @Tags tutorial
// @Security JwtAuth
// @Produce json
// @Param id path string true "Tutorial ID"
// @Success 204 {string} string "Deleted"
// @Failure 403 {string} string "Forbidden"
// @Failure 404 {string} string "Not found"
// @Failure 409 {string} string "Tutorial still has related data"
// @Router /tutorials/{id} [delete]
func (h *TutorialHandler) DeleteTutorial(c *gin.Context) {
	if !h.canManage(c) {
		return
	}

	if err := h.usecase.Delete(c.Param("id")); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Tutorial deleted successfully",
		Data:       true,
	}.Send(c)
}

// canManage lets only the creating tutor, or an admin, change a tutorial.
// It writes the error response itself and returns false when access is denied.
func (h *TutorialHandler) canManage(c *gin.Context) bool {
	role := c.GetString("role")
	if role == "admin" {
		return true
	}
	if role != "tutor" {
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", "only a tutor can change a tutorial").Send(c)
		return false
	}

	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return false
	}
	// someone else's tutorial looks the same as a missing one
	if item.CreatedBy == nil || item.CreatedBy.String() != c.GetString("user_id") {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", "record not found").Send(c)
		return false
	}
	return true
}

func (h *TutorialHandler) notFoundOrError(c *gin.Context, err error) {
	// foreign key violation: meetings, payments or students still reference it
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		response.NewErrorResponse(http.StatusConflict, "Tutorial still has related data", "remove its meetings, payments and students first").Send(c)
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "Tutorial not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process tutorial", err.Error()).Send(c)
}
