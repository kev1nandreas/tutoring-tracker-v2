package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type TutorialUsecase interface {
	FindAll(params pagination.Params) ([]entity.Tutorial, pagination.Meta, error)
	FindByID(id string) (*entity.Tutorial, error)
	Create(req dto.CreateTutorialRequest) (*entity.Tutorial, error)
	Update(id string, req dto.UpdateTutorialRequest) (*entity.Tutorial, error)
	Delete(id string) error
}
