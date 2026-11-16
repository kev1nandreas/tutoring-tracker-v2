package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/cache"
	"gorm.io/gorm"
)

func NewDashboardUsecase(db *gorm.DB, c *cache.Cache) usecase.DashboardUsecase {
	return usecase.NewDashboardUsecase(repository.NewDashboardPostgresRepository(db), c)
}
