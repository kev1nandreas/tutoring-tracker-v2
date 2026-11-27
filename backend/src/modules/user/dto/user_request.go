package dto

import "github.com/google/uuid"

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
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

// CreateUserRequest is an admin creating an account of any role.
type CreateUserRequest struct {
	Role string `json:"role" binding:"required,oneof=admin tutor student"`
	RegisterRequest
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

// GoogleLoginRequest carries the Google ID token obtained by the frontend.
type GoogleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

// SetPasswordRequest sets or changes the caller's password. CurrentPassword is required
// only when the account already has a password (not for a Google sign-up setting its first).
type SetPasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// CompleteProfileRequest is the identity a Google sign-up still lacks.
type CompleteProfileRequest struct {
	Name     string `json:"name" binding:"required,max=100"`
	School   string `json:"school" binding:"required,max=100"`
	Phone    string `json:"phone" binding:"required,max=13,numeric"`
	Username string `json:"username" binding:"required,min=3,max=50"`
	// Email is optional: empty keeps the current one. A new email must be verified again.
	Email string `json:"email" binding:"omitempty,email,max=100"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type EmailNotificationsRequest struct {
	Enabled *bool `json:"enabled" binding:"required"`
}

// GoogleRegisterRequest finishes a Google sign-up with what Google does not give.
type GoogleRegisterRequest struct {
	RegistrationToken string `json:"registration_token" binding:"required"`
	Name              string `json:"name" binding:"required,max=100"`
	School            string `json:"school" binding:"required,max=100"`
	Phone             string `json:"phone" binding:"required,max=13,numeric"`
	Username          string `json:"username" binding:"required,min=3,max=50"`
}
