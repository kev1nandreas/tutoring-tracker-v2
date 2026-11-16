package dto

import "time"

// StudentRow is a student of a tutor: a user accepted into at least one of the tutor's tutorials.
type StudentRow struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Username      string `json:"username"`
	Email         string `json:"email"`
	School        string `json:"school"`
	Phone         string `json:"phone"`
	TutorialCount int    `json:"tutorial_count"`
	// LastLoginAt is nil until the student logs in for the first time.
	LastLoginAt *time.Time `json:"last_login_at"`
}

// StudentTutorial is how one student is doing in one tutorial of the tutor.
type StudentTutorial struct {
	TutorialID string `json:"tutorial_id"`
	CustomID   string `json:"custom_id"`
	Name       string `json:"name"`
	IsDone     bool   `json:"is_done"`
	// Status is the enrollment state: pending, accepted or declined.
	Status        string `json:"status"`
	TotalMeetings int    `json:"total_meetings"`
	Attended      int    `json:"attended"`
	Submitted     int    `json:"submitted"`
	// AvgGrade is the mean of the graded homework (0-100); nil when nothing is graded.
	AvgGrade *float64 `json:"avg_grade"`
}

type StudentDetail struct {
	StudentRow
	Tutorials []StudentTutorial `json:"tutorials"`
}
