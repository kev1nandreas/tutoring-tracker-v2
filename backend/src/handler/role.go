package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type RoleHandler struct {
	usecase usecase.RoleUsecase
}

func NewRoleHandler(uc usecase.RoleUsecase) *RoleHandler {
	return &RoleHandler{usecase: uc}
}

// FindRoles godoc
// @Summary List roles with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags role
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.Role
// @Router /roles [get]
func (h *RoleHandler) FindRoles(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve roles", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Roles retrieved successfully", items, meta).Send(c)
}

// CreateRole godoc
// @Summary Create a role
// @Tags role
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param input body dto.CreateRoleRequest true "Create role"
// @Success 201 {object} entity.Role
// @Failure 400 {string} string "Bad Request"
// @Router /roles [post]
func (h *RoleHandler) CreateRole(c *gin.Context) {
	var input dto.CreateRoleRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Create(input)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to create role", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Role created successfully",
		Data:       item,
	}.Send(c)
}

// FindRole godoc
// @Summary Get a role by ID
// @Tags role
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {object} entity.Role
// @Failure 404 {string} string "Not found"
// @Router /roles/{id} [get]
func (h *RoleHandler) FindRole(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Role retrieved successfully", item).Send(c)
}

// UpdateRole godoc
// @Summary Update a role by ID
// @Tags role
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param input body dto.UpdateRoleRequest true "Update role"
// @Success 200 {object} entity.Role
// @Failure 404 {string} string "Not found"
// @Router /roles/{id} [put]
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	var input dto.UpdateRoleRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Update(c.Param("id"), input)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("Role updated successfully", item).Send(c)
}

// DeleteRole godoc
// @Summary Delete a role by ID
// @Tags role
// @Security JwtAuth
// @Produce json
// @Param id path string true "Role ID"
// @Success 204 {string} string "Deleted"
// @Failure 404 {string} string "Not found"
// @Router /roles/{id} [delete]
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	if err := h.usecase.Delete(c.Param("id")); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "Role deleted successfully",
		Data:       true,
	}.Send(c)
}

func (h *RoleHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "Role not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process role", err.Error()).Send(c)
}
