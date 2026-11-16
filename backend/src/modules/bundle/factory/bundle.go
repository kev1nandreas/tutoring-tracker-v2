package factory

import (
	"context"
	"io"

	"github.com/kev1nandreas/go-rest-api-template/src/factory"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/usecase"
	"gorm.io/gorm"
)

// storeAdapter lets the MinIO wrapper satisfy usecase.ObjectStore.
type storeAdapter struct{ s *factory.Storage }

func (a storeAdapter) GetObject(ctx context.Context, key string) (io.ReadCloser, error) {
	return a.s.GetObject(ctx, key)
}

func (a storeAdapter) StatSize(ctx context.Context, key string) (int64, error) {
	return a.s.StatSize(ctx, key)
}

func NewBundleUsecase(db *gorm.DB, storage *factory.Storage, publisher usecase.Publisher, sender usecase.Sender) usecase.BundleUsecase {
	return usecase.NewBundleUsecase(repository.NewBundlePostgresRepository(db), storeAdapter{storage}, publisher, sender)
}
