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
	TutorialCreator(tutorialID string) (*uuid.UUID, error)
	Create(meeting *entity.Meeting) error
	Update(meeting *entity.Meeting) error
	Delete(meeting *entity.Meeting) error
}
