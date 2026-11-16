package dto

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	"time"

	"github.com/google/uuid"
)

// TutorialSummary is the only tutorial info exposed to the tutor in validation lists.
type TutorialSummary struct {
	Name     string `json:"name"`
	CustomID string `json:"custom_id"`
}

// PendingStudent is one enrollment request with the student's public info.
type PendingStudent struct {
	ID       uuid.UUID `json:"id"`
	UserID   uuid.UUID `json:"user_id"`
	Name     string    `json:"name"`
	Username string    `json:"username"`
	School   string    `json:"school"`
	// LastLoginAt is nil until the student logs in for the first time.
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

// TutorialPendingGroup is one tutorial with its enrollment requests.
type TutorialPendingGroup struct {
	Tutorial           TutorialSummary  `json:"tutorial"`
	PendingValidations []PendingStudent `json:"pending_validations"`
}

type ValidateResponse struct {
	// Updated are the students whose status changed.
	Updated []uuid.UUID `json:"updated"`
	// Skipped are ids that had no pending request for this tutorial.
	Skipped []uuid.UUID `json:"skipped"`
}

// ToPendingStudent maps an entity (with User preloaded) to the response shape.
func ToPendingStudent(pv entity.PendingValidation) PendingStudent {
	out := PendingStudent{ID: pv.ID, UserID: pv.UserID, CreatedAt: pv.CreatedAt}
	if pv.User != nil {
		out.Name = pv.User.Name
		out.Username = pv.User.Username
		out.School = pv.User.School
		out.LastLoginAt = pv.User.LastLoginAt
	}
	return out
}
