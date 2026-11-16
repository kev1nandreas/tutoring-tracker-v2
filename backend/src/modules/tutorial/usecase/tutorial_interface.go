package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type TutorialUsecase interface {
	FindAll(params pagination.Params, creatorID *uuid.UUID) ([]entity.Tutorial, pagination.Meta, error)
	FindByID(id string) (*entity.Tutorial, error)
	Create(creatorID uuid.UUID, req dto.CreateTutorialRequest) (*entity.Tutorial, error)
	Update(id string, req dto.UpdateTutorialRequest) (*entity.Tutorial, error)
	Delete(id string) error
}
