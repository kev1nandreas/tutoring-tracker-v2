package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/usecase"
	"gorm.io/gorm"
)

func NewDashboardUsecase(db *gorm.DB) usecase.DashboardUsecase {
	return usecase.NewDashboardUsecase(repository.NewDashboardPostgresRepository(db))
}
