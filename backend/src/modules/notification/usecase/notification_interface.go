package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type NotificationUsecase interface {
	FindByUserID(userID string, params pagination.Params) ([]entity.Notification, pagination.Meta, error)
	FindByID(id string) (*entity.Notification, error)
	// Create is for internal callers; it is not exposed over HTTP.
	Create(req dto.CreateNotificationRequest) (*entity.Notification, error)
	// NotifyUsers sends the same unread notification to every user in userIDs.
	NotifyUsers(userIDs []uuid.UUID, notificationType, header, body string) error
	MarkAsRead(id string) (*entity.Notification, error)
}
