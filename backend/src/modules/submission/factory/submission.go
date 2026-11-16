package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/usecase"
	"gorm.io/gorm"
)

func NewSubmissionUsecase(db *gorm.DB) usecase.SubmissionUsecase {
	repo := repository.NewSubmissionPostgresRepository(db)
	return usecase.NewSubmissionUsecase(repo)
}
