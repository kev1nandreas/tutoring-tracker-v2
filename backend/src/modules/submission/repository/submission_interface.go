package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type SubmissionRepository interface {
	MeetingExists(meetingID uuid.UUID) (bool, error)
	// FindByMeetingID lists submissions of a meeting; a non-nil userID limits it to that user's.
	FindByMeetingID(meetingID uuid.UUID, userID *uuid.UUID, params pagination.Params) ([]entity.Submission, pagination.Meta, error)
	FindByID(id uuid.UUID) (*entity.Submission, error)
	Create(submission *entity.Submission) error
	Delete(submission *entity.Submission) error
}
