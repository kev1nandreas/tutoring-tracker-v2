package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
)

type AdminHandler struct {
	usecase usecase.AdminUsecase
}

func NewAdminHandler(uc usecase.AdminUsecase) *AdminHandler {
	return &AdminHandler{usecase: uc}
}

// ListUsers godoc
// @Summary List every registered user
// @Description Admins only. Search with ?q= (name, username, email or school), filter with ?role=admin|tutor|student.
// @Tags admin
// @Security JwtAuth
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param q query string false "Search"
// @Param role query string false "Role"
// @Param sort query string false "name, email, role, last_login_at, created_at or tutorial_count"
// @Param order query string false "asc or desc"
// @Success 200 {array} dto.UserRow
// @Failure 403 {string} string "Not an admin"
// @Router /admin/users [get]
func (h *AdminHandler) ListUsers(c *gin.Context) {
	params := pagination.ParseParams(c)
	items, meta, err := h.usecase.ListUsers(c.GetString("role"), c.Query("q"), c.Query("role"), params)
	if err != nil {
		h.fail(c, err, "Failed to retrieve users")
		return
	}
	response.NewPaginatedResponse("Users retrieved successfully", items, meta).Send(c)
}

// DeleteUser godoc
// @Summary Delete a user and everything that is theirs
// @Description Admins only, never their own account. A tutor's tutorials go with them (meetings, files, enrollments, payments); a student's enrollments, homework, attendance and download requests too. A student's payments stay with the tutor, without the student. Notifications and stored files are removed.
// @Tags admin
// @Security JwtAuth
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {string} string "Deleted"
// @Failure 403 {string} string "Not an admin, or your own account"
// @Failure 404 {string} string "Not found"
// @Router /admin/users/{id} [delete]
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	callerID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "invalid token, please log in again").Send(c)
		return
	}
	if err := h.usecase.DeleteUser(c.Request.Context(), callerID, c.GetString("role"), c.Param("id")); err != nil {
		h.fail(c, err, "Failed to delete user")
		return
	}
	response.NewSuccessResponse("User deleted", true).Send(c)
}

// RequireAdmin stops anyone but an admin.
func (h *AdminHandler) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("role") != "admin" {
			response.NewErrorResponse(http.StatusForbidden, "Forbidden", usecase.ErrForbidden.Error()).Send(c)
			c.Abort()
		}
	}
}

func (h *AdminHandler) fail(c *gin.Context, err error, msg string) {
	switch {
	case errors.Is(err, usecase.ErrForbidden), errors.Is(err, usecase.ErrSelf):
		response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
	case errors.Is(err, usecase.ErrNotFound):
		response.NewErrorResponse(http.StatusNotFound, "Not found", err.Error()).Send(c)
	default:
		response.NewErrorResponse(http.StatusInternalServerError, msg, err.Error()).Send(c)
	}
}
