package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/usecase"
	"gorm.io/gorm"
)

func NewPendingValidationUsecase(db *gorm.DB) usecase.PendingValidationUsecase {
	repo := repository.NewPendingValidationPostgresRepository(db)
	return usecase.NewPendingValidationUsecase(repo)
}
