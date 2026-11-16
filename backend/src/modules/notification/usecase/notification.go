package usecase

import (
	"log"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/notification/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

// Mailer sends one email (implemented by mailer.Mailer).
type Mailer interface {
	Send(to, subject, body string) error
}

// EmailLookup resolves user IDs to their email addresses.
type EmailLookup func(userIDs []uuid.UUID) (map[uuid.UUID]string, error)

type notificationUsecase struct {
	repo   repository.NotificationRepository
	mailer Mailer
	emails EmailLookup
}

// NewNotificationUsecase builds the usecase. mailer and emails are optional: when either is
// nil, notifications are only stored (in-app).
func NewNotificationUsecase(repo repository.NotificationRepository, mailer Mailer, emails EmailLookup) NotificationUsecase {
	return &notificationUsecase{repo: repo, mailer: mailer, emails: emails}
}

// emailAsync mails the same header/body to every user. Best effort: runs in the background and
// only logs failures, so a mail outage never fails or delays the in-app notification.
func (u *notificationUsecase) emailAsync(userIDs []uuid.UUID, header, body string) {
	if u.mailer == nil || u.emails == nil || len(userIDs) == 0 {
		return
	}
	go func() {
		addrs, err := u.emails(userIDs)
		if err != nil {
			log.Printf("notification: email lookup failed: %v", err)
			return
		}
		for _, id := range userIDs {
			addr := addrs[id]
			if addr == "" {
				continue
			}
			if err := u.mailer.Send(addr, header, body); err != nil {
				log.Printf("notification: email to user %s failed: %v", id, err)
			}
		}
	}()
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
	u.emailAsync([]uuid.UUID{req.UserID}, req.Header, req.Body)

	return notification, nil
}

func (u *notificationUsecase) NotifyUsers(userIDs []uuid.UUID, notificationType, header, body string) error {
	items := make([]entity.Notification, len(userIDs))
	for i, id := range userIDs {
		items[i] = entity.Notification{UserID: id, Type: notificationType, Header: header, Body: body}
	}
	if err := u.repo.CreateMany(items); err != nil {
		return err
	}
	u.emailAsync(userIDs, header, body)
	return nil
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
