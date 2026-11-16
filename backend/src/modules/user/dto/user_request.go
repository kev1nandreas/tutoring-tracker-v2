package dto

import "github.com/google/uuid"

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	School   string `json:"school" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UpdateUserRequest struct {
	RoleID   *uuid.UUID `json:"role_id"`
	Name     *string    `json:"name"`
	School   *string    `json:"school"`
	Phone    *string    `json:"phone"`
	Email    *string    `json:"email"`
	Username *string    `json:"username"`
	Password *string    `json:"password"`
}
