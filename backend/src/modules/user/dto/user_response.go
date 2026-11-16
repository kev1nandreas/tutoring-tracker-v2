package dto

import (
	"time"

	"github.com/google/uuid"
)

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	RoleID    uuid.UUID `json:"role_id"`
	Name      string    `json:"name"`
	School    string    `json:"school"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MeResponse is the authenticated user's profile, role included.
type MeResponse struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	School      string     `json:"school"`
	Phone       string     `json:"phone"`
	Email       string     `json:"email"`
	Username    string     `json:"username"`
	RoleID      uuid.UUID  `json:"role_id"`
	Role        string     `json:"role"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type LoginResponse struct {
	Token string     `json:"token"`
	User  MeResponse `json:"user"`
}
