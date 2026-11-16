package factory

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/usecase"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"go.mongodb.org/mongo-driver/mongo"
	"gorm.io/gorm"
)

// NewNotificationUsecase stores notifications in col and, when mailer is not nil, also emails
// them to the users (addresses come from the users table in db).
func NewNotificationUsecase(col *mongo.Collection, db *gorm.DB, mailer usecase.Mailer) usecase.NotificationUsecase {
	repo := repository.NewNotificationMongoRepository(col)
	if mailer == nil {
		return usecase.NewNotificationUsecase(repo, nil, nil)
	}
	lookup := func(ids []uuid.UUID) (map[uuid.UUID]string, error) {
		var users []userEntity.User
		if err := db.Select("id", "email").Where("id IN ?", ids).Find(&users).Error; err != nil {
			return nil, err
		}
		out := make(map[uuid.UUID]string, len(users))
		for _, u := range users {
			out[u.ID] = u.Email
		}
		return out, nil
	}
	return usecase.NewNotificationUsecase(repo, mailer, lookup)
}
