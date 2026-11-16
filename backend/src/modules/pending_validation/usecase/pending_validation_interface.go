package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type PendingValidationUsecase interface {
	// Enroll lets a student request to join a tutorial by its code.
	Enroll(callerID uuid.UUID, role string, req dto.EnrollRequest) (*entity.PendingValidation, error)
	// FindMine lists the student's own enrollment requests with their status.
	FindMine(callerID uuid.UUID, role string, params pagination.Params) ([]dto.MyEnrollment, pagination.Meta, error)
	// FindGrouped lists requests of every tutorial the caller created, grouped by tutorial.
	// status (optional) keeps only requests in that state; search matches student name, username or school.
	FindGrouped(callerID uuid.UUID, role string, status *int, search string, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error)
	// FindByTutorial lists requests of a tutorial; only its creator may call it.
	FindByTutorial(callerID uuid.UUID, role, tutorialID string, params pagination.Params) ([]dto.PendingStudent, pagination.Meta, error)
	// Validate accepts or declines many students at once; only the tutorial's creator may call it.
	Validate(callerID uuid.UUID, role string, req dto.ValidateRequest) (*dto.ValidateResponse, error)
	// Unenroll removes an accepted student from a tutorial; only its creator may call it.
	// It returns ErrNotFound when the student is not enrolled.
	Unenroll(callerID uuid.UUID, role, tutorialID, studentID string) error
}
