package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type SubmissionUsecase interface {
	// FindByMeetingID lists a meeting's submissions. A student only gets their own.
	FindByMeetingID(meetingID string, callerID uuid.UUID, role string, params pagination.Params) ([]dto.SubmissionResponse, pagination.Meta, error)
	Create(meetingID string, callerID uuid.UUID, req dto.CreateSubmissionRequest) (*dto.SubmissionResponse, error)
	// Grade sets the grade and feedback. Only the tutor of the meeting's tutorial (or an admin).
	Grade(id string, callerID uuid.UUID, role string, req dto.GradeSubmissionRequest) (*dto.SubmissionResponse, error)
	// Delete removes a submission; only the user who made it may do so.
	Delete(id string, callerID uuid.UUID) error
}
