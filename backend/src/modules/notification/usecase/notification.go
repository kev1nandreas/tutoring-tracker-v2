package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type notificationUsecase struct {
	repo repository.NotificationRepository
}

func NewNotificationUsecase(repo repository.NotificationRepository) NotificationUsecase {
	return &notificationUsecase{repo: repo}
}

func (u *notificationUsecase) FindByUserID(userID string, params pagination.Params) ([]entity.Notification, pagination.Meta, error) {
	return u.repo.FindByUserID(userID, params)
}

func (u *notificationUsecase) FindByID(id string) (*entity.Notification, error) {
	return u.repo.FindByID(id)
}

func (u *notificationUsecase) Create(req dto.CreateNotificationRequest) (*entity.Notification, error) {
	notification := &entity.Notification{
		UserID: req.UserID,
		Type:   req.Type,
		Header: req.Header,
		Body:   req.Body,
	}

	if err := u.repo.Create(notification); err != nil {
		return nil, err
	}

	return notification, nil
}

func (u *notificationUsecase) MarkAsRead(id string) (*entity.Notification, error) {
	notification, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if notification.IsRead {
		return notification, nil
	}

	notification.IsRead = true
	if err := u.repo.Update(notification); err != nil {
		return nil, err
	}

	return notification, nil
}
