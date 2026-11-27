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

// UserTutorial is one tutorial in a user's detail: one the tutor created, or one the
// student asked to join.
type UserTutorial struct {
	TutorialID string `json:"tutorial_id"`
	CustomID   string `json:"custom_id"`
	Name       string `json:"name"`
	IsDone     bool   `json:"is_done"`
	// TutorName is who runs it (for a student's tutorials).
	TutorName string `json:"tutor_name"`
	// Status is the student's enrollment: pending, accepted or declined; empty for a tutor's own.
	Status string `json:"status"`
	// StudentCount is the accepted students (for a tutor's own tutorials).
	StudentCount int `json:"student_count"`
}

// UserDetail is one user with their account state and tutorials.
type UserDetail struct {
	UserRow
	EmailVerified bool           `json:"email_verified"`
	HasPassword   bool           `json:"has_password"`
	Tutorials     []UserTutorial `json:"tutorials"`
}
