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
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	School   string    `json:"school"`
	Phone    string    `json:"phone"`
	Email    string    `json:"email"`
	Username string    `json:"username"`
	RoleID   uuid.UUID `json:"role_id"`
	Role     string    `json:"role"`
	// ProfileComplete is false for a Google sign-up that has not yet given its school and phone.
	ProfileComplete bool `json:"profile_complete"`
	// EmailVerified: Google sign-ups start verified; others verify by link.
	EmailVerified      bool `json:"email_verified"`
	EmailNotifications bool `json:"email_notifications"`
	// HasPassword is false for a Google sign-up that has not set a password yet: it can
	// only sign in with Google until it does.
	HasPassword bool       `json:"has_password"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type LoginResponse struct {
	Token string     `json:"token"`
	User  MeResponse `json:"user"`
}

// GoogleLoginResponse is either a normal login (Token and User) or, for an email with
// no account yet, NeedsRegistration with a short-lived token for the registration form.
type GoogleLoginResponse struct {
	NeedsRegistration bool        `json:"needs_registration"`
	RegistrationToken string      `json:"registration_token,omitempty"`
	Email             string      `json:"email,omitempty"`
	Name              string      `json:"name,omitempty"`
	Token             string      `json:"token,omitempty"`
	User              *MeResponse `json:"user,omitempty"`
}
