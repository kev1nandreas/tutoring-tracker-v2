package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type TutorialRepository interface {
	FindAll(params pagination.Params, creatorID *uuid.UUID) ([]entity.Tutorial, pagination.Meta, error)
	FindByID(id string) (*entity.Tutorial, error)
	ExistsByCustomID(customID string) (bool, error)
	Create(tutorial *entity.Tutorial) error
	Update(tutorial *entity.Tutorial) error
	Delete(tutorial *entity.Tutorial) error
}
