package usecase

import (
	"context"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var (
	ErrForbidden = errors.New("only an admin can manage users")
	ErrNotFound  = errors.New("user not found")
	ErrSelf      = errors.New("you cannot delete your own account")
)

// FileStore removes stored files (implemented by factory.Storage).
type FileStore interface {
	RemoveMeetingFiles(ctx context.Context, meetingIDs []uuid.UUID)
	Remove(ctx context.Context, key string) error
}

type AdminUsecase interface {
	// ListUsers returns every registered user. Admins only.
	ListUsers(role, search, roleFilter string, params pagination.Params) ([]dto.UserRow, pagination.Meta, error)
	// UserDetail returns one user with their account state and tutorials. Admins only.
	UserDetail(role, id string) (*dto.UserDetail, error)
	// DeleteUser removes a user and everything that is theirs: a tutor's tutorials (with
	// meetings, files, enrollments and payments), a student's enrollments, homework,
	// attendance and download requests, and their notifications. A student's payments
	// stay in the tutor's records without the student. Admins only, never themselves.
	DeleteUser(ctx context.Context, callerID uuid.UUID, role, id string) error
}

type adminUsecase struct {
	repo          repository.AdminRepository
	files         FileStore
	notifications repository.NotificationCleaner
}

func NewAdminUsecase(repo repository.AdminRepository, files FileStore, notifications repository.NotificationCleaner) AdminUsecase {
	return &adminUsecase{repo: repo, files: files, notifications: notifications}
}

func (u *adminUsecase) ListUsers(role, search, roleFilter string, params pagination.Params) ([]dto.UserRow, pagination.Meta, error) {
	if role != "admin" {
		return nil, pagination.Meta{}, ErrForbidden
	}
	switch roleFilter {
	case "", "admin", "tutor", "student":
	default:
		roleFilter = ""
	}
	return u.repo.List(search, roleFilter, params)
}

func (u *adminUsecase) UserDetail(role, id string) (*dto.UserDetail, error) {
	if role != "admin" {
		return nil, ErrForbidden
	}
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrNotFound
	}
	d, err := u.repo.Detail(uid)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return d, err
}

func (u *adminUsecase) DeleteUser(ctx context.Context, callerID uuid.UUID, role, id string) error {
	if role != "admin" {
		return ErrForbidden
	}
	uid, err := uuid.Parse(id)
	if err != nil {
		return ErrNotFound
	}
	if uid == callerID {
		return ErrSelf
	}

	removed, err := u.repo.Delete(uid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}

	// the rows are gone; files and notifications are swept best effort
	u.files.RemoveMeetingFiles(ctx, removed.MeetingIDs)
	for _, key := range removed.PhotoKeys {
		if err := u.files.Remove(ctx, key); err != nil {
			log.Printf("admin: could not remove %q of deleted user %s: %v", key, uid, err)
		}
	}
	if err := u.notifications.DeleteByUser(ctx, uid); err != nil {
		log.Printf("admin: could not remove notifications of deleted user %s: %v", uid, err)
	}
	return nil
}
