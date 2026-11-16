package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/role/usecase"
	"gorm.io/gorm"
)

func NewRoleUsecase(db *gorm.DB) usecase.RoleUsecase {
	repo := repository.NewRolePostgresRepository(db)
	return usecase.NewRoleUsecase(repo)
}
