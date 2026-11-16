package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type NotificationRepository interface {
	FindByUserID(userID string, params pagination.Params) ([]entity.Notification, pagination.Meta, error)
	FindByID(id string) (*entity.Notification, error)
	Create(notification *entity.Notification) error
	CreateMany(notifications []entity.Notification) error
	Update(notification *entity.Notification) error
}
