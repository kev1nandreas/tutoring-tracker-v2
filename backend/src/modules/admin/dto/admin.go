package dto

import "time"

// UserRow is one registered user as the admin sees it.
type UserRow struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	School   string `json:"school"`
	Phone    string `json:"phone"`
	// Role is admin, tutor or student.
	Role string `json:"role"`
	// TutorialCount is the tutorials a tutor created, or the ones a student was accepted into.
	TutorialCount int `json:"tutorial_count"`
	// LastLoginAt is nil until the user logs in for the first time.
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}
