package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type RoleRepository interface {
	FindAll(params pagination.Params) ([]entity.Role, pagination.Meta, error)
	FindByID(id string) (*entity.Role, error)
	Create(role *entity.Role) error
	Update(role *entity.Role) error
	Delete(role *entity.Role) error
}
