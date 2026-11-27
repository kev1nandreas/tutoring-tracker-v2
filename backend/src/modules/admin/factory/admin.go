package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/usecase"
	"go.mongodb.org/mongo-driver/mongo"
	"gorm.io/gorm"
)

// NewAdminUsecase builds the admin usecase. notifications is the MongoDB notification collection.
func NewAdminUsecase(db *gorm.DB, files usecase.FileStore, notifications *mongo.Collection) usecase.AdminUsecase {
	return usecase.NewAdminUsecase(
		repository.NewAdminPostgresRepository(db),
		files,
		repository.NewNotificationMongoCleaner(notifications),
	)
}
