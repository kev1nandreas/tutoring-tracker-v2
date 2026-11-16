package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/entity"
)

// SubmissionUser is the public info of the student who submitted.
type SubmissionUser struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Username string    `json:"username"`
	School   string    `json:"school"`
}

type SubmissionResponse struct {
	ID        uuid.UUID       `json:"id"`
	MeetingID uuid.UUID       `json:"meeting_id"`
	UserID    uuid.UUID       `json:"user_id"`
	User      *SubmissionUser `json:"user,omitempty"`
	Answer    string          `json:"answer"`
	Files     string          `json:"files"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// ToSubmissionResponse maps an entity; user info is included when User is preloaded.
func ToSubmissionResponse(s entity.Submission) SubmissionResponse {
	out := SubmissionResponse{
		ID:        s.ID,
		MeetingID: s.MeetingID,
		UserID:    s.UserID,
		Answer:    s.Answer,
		Files:     s.Files,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
	if s.User.ID != uuid.Nil {
		out.User = &SubmissionUser{ID: s.User.ID, Name: s.User.Name, Username: s.User.Username, School: s.User.School}
	}
	return out
}
