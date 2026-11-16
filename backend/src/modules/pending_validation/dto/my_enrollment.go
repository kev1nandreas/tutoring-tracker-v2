package dto

import "time"

// Enrollment states as shown to a student.
const (
	StatusPendingText  = "pending"
	StatusAcceptedText = "accepted"
	StatusDeclinedText = "declined"
)

// EnrollmentTutorial is the tutorial info a student sees in their history.
type EnrollmentTutorial struct {
	Name        string `json:"name"`
	CustomID    string `json:"custom_id"`
	Description string `json:"description"`
	DateStarted string `json:"date_started"` // YYYY-MM-DD
	DateEnded   string `json:"date_ended"`   // YYYY-MM-DD
	IsDone      bool   `json:"is_done"`
}

// MyEnrollment is one of the caller's enrollment requests and where it stands.
type MyEnrollment struct {
	ID       string             `json:"id"`
	Status   string             `json:"status"` // pending, accepted or declined
	Tutorial EnrollmentTutorial `json:"tutorial"`
	// RequestedAt is when the student asked; DecidedAt when the status last changed
	// (equal to RequestedAt while still pending).
	RequestedAt time.Time `json:"requested_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// StatusText maps pending_validations.is_validated to its text form.
func StatusText(isValidated int) string {
	switch isValidated {
	case 1:
		return StatusAcceptedText
	case 2:
		return StatusDeclinedText
	default:
		return StatusPendingText
	}
}
