package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/usecase"
	"gorm.io/gorm"
)

func NewMeetingUsecase(db *gorm.DB, files usecase.FileCleaner) usecase.MeetingUsecase {
	repo := repository.NewMeetingPostgresRepository(db)
	return usecase.NewMeetingUsecase(repo, files)
}
