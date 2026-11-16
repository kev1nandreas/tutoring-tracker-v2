package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/usecase"
	"gorm.io/gorm"
)

func NewTutorialUsecase(db *gorm.DB) usecase.TutorialUsecase {
	repo := repository.NewTutorialPostgresRepository(db)
	return usecase.NewTutorialUsecase(repo)
}
