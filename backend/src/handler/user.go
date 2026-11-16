package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/response"
	"gorm.io/gorm"
)

type UserHandler struct {
	usecase usecase.UserUsecase
}

func NewUserHandler(uc usecase.UserUsecase) *UserHandler {
	return &UserHandler{usecase: uc}
}

// FindUsers godoc
// @Summary List users with pagination
// @Description Paginated. Non-text columns (ids, flags, numbers, dates) can be used as exact filters, e.g. ?role_id=<uuid>
// @Tags user
// @Produce json
// @Param page query int false "Page" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort query string false "Sort column"
// @Param order query string false "asc or desc"
// @Success 200 {array} entity.User
// @Router /users [get]
func (h *UserHandler) FindUsers(c *gin.Context) {
	params := pagination.ParseParams(c)

	items, meta, err := h.usecase.FindAll(params)
	if err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve users", err.Error()).Send(c)
		return
	}

	response.NewPaginatedResponse("Users retrieved successfully", items, meta).Send(c)
}

// FindUser godoc
// @Summary Get a user by ID
// @Tags user
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} entity.User
// @Failure 404 {string} string "Not found"
// @Router /users/{id} [get]
func (h *UserHandler) FindUser(c *gin.Context) {
	item, err := h.usecase.FindByID(c.Param("id"))
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("User retrieved successfully", item).Send(c)
}

// UpdateUser godoc
// @Summary Update a user by ID
// @Tags user
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param input body dto.UpdateUserRequest true "Update user"
// @Success 200 {object} entity.User
// @Failure 404 {string} string "Not found"
// @Router /users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	var input dto.UpdateUserRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	item, err := h.usecase.Update(c.Param("id"), input)
	if err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.NewSuccessResponse("User updated successfully", item).Send(c)
}

// DeleteUser godoc
// @Summary Delete a user by ID
// @Tags user
// @Security JwtAuth
// @Produce json
// @Param id path string true "User ID"
// @Success 204 {string} string "Deleted"
// @Failure 404 {string} string "Not found"
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	if err := h.usecase.Delete(c.Param("id")); err != nil {
		h.notFoundOrError(c, err)
		return
	}

	response.Response{
		StatusCode: http.StatusNoContent,
		Success:    true,
		Message:    "User deleted successfully",
		Data:       true,
	}.Send(c)
}

func (h *UserHandler) notFoundOrError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NewErrorResponse(http.StatusNotFound, "User not found", err.Error()).Send(c)
		return
	}
	response.NewErrorResponse(http.StatusInternalServerError, "Failed to process user", err.Error()).Send(c)
}

// LoginHandler godoc
// @Summary Authenticate a user
// @Description Authenticates a user using username and password, returns a JWT token if successful
// @Tags user
// @Accept json
// @Produce json
// @Param user body dto.LoginRequest true "User login object"
// @Success 200 {string} string "JWT Token"
// @Failure 400 {string} string "Bad Request"
// @Failure 401 {string} string "Unauthorized"
// @Router /login [post]
func (h *UserHandler) LoginHandler(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Bad Request", err.Error()).Send(c)
		return
	}

	loginResp, err := h.usecase.Login(req)
	if err != nil {
		response.NewErrorResponse(http.StatusUnauthorized, "Invalid username or password", err.Error()).Send(c)
		return
	}

	response.NewSuccessResponse("Login successful", gin.H{"token": loginResp.Token}).Send(c)
}

// RegisterHandler godoc
// @Summary Register a new student
// @Description Registers a new user. The role is always student.
// @Tags user
// @Accept json
// @Produce json
// @Param user body dto.RegisterRequest true "User registration object"
// @Success 201 {string} string "Successfully registered"
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /register [post]
func (h *UserHandler) RegisterHandler(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	if _, err := h.usecase.Register(req); err != nil {
		response.NewErrorResponse(http.StatusInternalServerError, "Could not register user", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Registration successful",
	}.Send(c)
}

// RegisterTutorHandler godoc
// @Summary Register a new tutor
// @Description Registers a new tutor. Only an authenticated tutor may call this.
// @Tags user
// @Security JwtAuth
// @Accept json
// @Produce json
// @Param user body dto.RegisterRequest true "Tutor registration object"
// @Success 201 {string} string "Successfully registered"
// @Failure 400 {string} string "Bad Request"
// @Failure 403 {string} string "Forbidden"
// @Router /register/tutor [post]
func (h *UserHandler) RegisterTutorHandler(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.NewErrorResponse(http.StatusBadRequest, "Invalid request body", err.Error()).Send(c)
		return
	}

	if _, err := h.usecase.RegisterTutor(c.GetString("username"), req); err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			response.NewErrorResponse(http.StatusForbidden, "Forbidden", err.Error()).Send(c)
			return
		}
		response.NewErrorResponse(http.StatusInternalServerError, "Could not register tutor", err.Error()).Send(c)
		return
	}

	response.Response{
		StatusCode: http.StatusCreated,
		Success:    true,
		Message:    "Tutor registration successful",
	}.Send(c)
}

// MeHandler godoc
// @Summary Get the current user
// @Description Returns the authenticated user's id, profile and role
// @Tags user
// @Security JwtAuth
// @Produce json
// @Success 200 {object} dto.MeResponse
// @Failure 401 {string} string "Unauthorized"
// @Router /me [get]
func (h *UserHandler) MeHandler(c *gin.Context) {
	me, err := h.usecase.Me(c.GetString("username"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NewErrorResponse(http.StatusUnauthorized, "Unauthorized", "User no longer exists").Send(c)
			return
		}
		response.NewErrorResponse(http.StatusInternalServerError, "Failed to retrieve profile", err.Error()).Send(c)
		return
	}

	response.NewSuccessResponse("Profile retrieved successfully", me).Send(c)
}
