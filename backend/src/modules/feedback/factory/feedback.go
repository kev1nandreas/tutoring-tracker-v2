package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/usecase"
	"gorm.io/gorm"
)

func NewFeedbackUsecase(db *gorm.DB) usecase.FeedbackUsecase {
	return usecase.NewFeedbackUsecase(repository.NewFeedbackPostgresRepository(db))
}
