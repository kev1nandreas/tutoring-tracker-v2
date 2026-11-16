package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/usecase"
	"go.mongodb.org/mongo-driver/mongo"
)

func NewNotificationUsecase(col *mongo.Collection) usecase.NotificationUsecase {
	repo := repository.NewNotificationMongoRepository(col)
	return usecase.NewNotificationUsecase(repo)
}
