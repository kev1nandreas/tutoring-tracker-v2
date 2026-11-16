package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type TutorialUsecase interface {
	FindAll(params pagination.Params, creatorID *uuid.UUID) ([]entity.Tutorial, pagination.Meta, error)
	// FindEnrolled lists the tutorials a student was accepted into (students only).
	FindEnrolled(userID uuid.UUID, role string, done *bool, params pagination.Params) ([]dto.EnrolledTutorial, pagination.Meta, error)
	// FindEnrolledByID returns one tutorial the student was accepted into; gorm.ErrRecordNotFound otherwise.
	FindEnrolledByID(userID uuid.UUID, role, tutorialID string) (*dto.EnrolledTutorial, error)
	FindByID(id string) (*entity.Tutorial, error)
	Create(creatorID uuid.UUID, req dto.CreateTutorialRequest) (*entity.Tutorial, error)
	Update(id string, req dto.UpdateTutorialRequest) (*entity.Tutorial, error)
	Delete(id string) error
}
