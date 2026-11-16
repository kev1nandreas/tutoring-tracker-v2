package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/usecase"
	"gorm.io/gorm"
)

func NewJobUsecase(db *gorm.DB) usecase.JobUsecase {
	repo := repository.NewJobPostgresRepository(db)
	return usecase.NewJobUsecase(repo)
}
