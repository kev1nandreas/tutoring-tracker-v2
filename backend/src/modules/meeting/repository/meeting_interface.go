package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type MeetingRepository interface {
	FindAll(params pagination.Params) ([]entity.Meeting, pagination.Meta, error)
	FindByTutorialID(tutorialID string, params pagination.Params) ([]entity.Meeting, pagination.Meta, error)
	FindByID(id string) (*entity.Meeting, error)
	// TutorialCreator returns tutorials.created_by (nil when unset); gorm.ErrRecordNotFound if the tutorial is missing.
	// IsAcceptedStudent reports whether the user was accepted into the tutorial.
	IsAcceptedStudent(tutorialID string, userID uuid.UUID) (bool, error)
	TutorialCreator(tutorialID string) (*uuid.UUID, error)
	Create(meeting *entity.Meeting) error
	// CreateMany inserts all meetings in one statement: all or none.
	CreateMany(meetings []entity.Meeting) error
	// AllOfTutorial returns every meeting of a tutorial, unpaged (for duplicate checks).
	AllOfTutorial(tutorialID string) ([]entity.Meeting, error)
	Update(meeting *entity.Meeting) error
	Delete(meeting *entity.Meeting) error
}
