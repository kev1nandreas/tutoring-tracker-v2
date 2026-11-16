package factory

import (
	"context"

	"github.com/kev1nandreas/go-rest-api-template/src/factory"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/usecase"
	"gorm.io/gorm"
)

// storeAdapter lets the MinIO wrapper satisfy usecase.ObjectStore with plain strings.
type storeAdapter struct{ s *factory.Storage }

func (a storeAdapter) PresignedPost(ctx context.Context, key, contentType string, maxBytes int64) (string, map[string]string, error) {
	u, fields, err := a.s.PresignedPost(ctx, key, contentType, maxBytes)
	if err != nil {
		return "", nil, err
	}
	return u.String(), fields, nil
}

func (a storeAdapter) StatSize(ctx context.Context, key string) (int64, error) {
	return a.s.StatSize(ctx, key)
}

func (a storeAdapter) PresignedDownload(ctx context.Context, key, filename, contentType string, inline bool) (string, error) {
	u, err := a.s.PresignedDownload(ctx, key, filename, contentType, inline)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (a storeAdapter) Remove(ctx context.Context, key string) error { return a.s.Remove(ctx, key) }

func NewAttendanceUsecase(db *gorm.DB, storage *factory.Storage) usecase.AttendanceUsecase {
	return usecase.NewAttendanceUsecase(repository.NewAttendancePostgresRepository(db), storeAdapter{storage}, storage.UploadExpiry)
}
