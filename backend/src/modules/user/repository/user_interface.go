package repository

import (
	"time"

	"github.com/google/uuid"
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type UserRepository interface {
	FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error)
	FindByID(id string) (*entity.User, error)
	FindByUsername(username string) (*entity.User, error)
	FindRoleByName(name string) (*roleEntity.Role, error)
	UpdateLastLogin(id uuid.UUID, at time.Time) error
	Create(user *entity.User) error
	Update(user *entity.User) error
	Delete(user *entity.User) error
}
