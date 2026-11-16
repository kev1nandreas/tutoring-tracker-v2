package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/cache"
	"gorm.io/gorm"
)

func NewTutorialUsecase(db *gorm.DB, files usecase.FileCleaner, c *cache.Cache) usecase.TutorialUsecase {
	repo := repository.NewTutorialPostgresRepository(db)
	return usecase.NewTutorialUsecase(repo, files, c)
}
