package repository

import (
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type UserRepository interface {
	FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error)
	FindByID(id string) (*entity.User, error)
	FindByUsername(username string) (*entity.User, error)
	FindRoleByName(name string) (*roleEntity.Role, error)
	Create(user *entity.User) error
	Update(user *entity.User) error
	Delete(user *entity.User) error
}
