package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type MeetingUsecase interface {
	FindAll(params pagination.Params) ([]entity.Meeting, pagination.Meta, error)
	FindByTutorialID(tutorialID string, params pagination.Params) ([]entity.Meeting, pagination.Meta, error)
	FindByID(id string) (*entity.Meeting, error)
	Create(req dto.CreateMeetingRequest) (*entity.Meeting, error)
	Update(id string, req dto.UpdateMeetingRequest) (*entity.Meeting, error)
	Delete(id string) error
	// IsAcceptedStudent: whether the user was accepted into the tutorial.
	IsAcceptedStudent(tutorialID string, userID uuid.UUID) (bool, error)
	// TutorialCreator: who created the tutorial (for access checks).
	TutorialCreator(tutorialID string) (*uuid.UUID, error)
}
