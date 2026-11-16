package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type RoleUsecase interface {
	FindAll(params pagination.Params) ([]entity.Role, pagination.Meta, error)
	FindByID(id string) (*entity.Role, error)
	Create(req dto.CreateRoleRequest) (*entity.Role, error)
	Update(id string, req dto.UpdateRoleRequest) (*entity.Role, error)
	Delete(id string) error
}
