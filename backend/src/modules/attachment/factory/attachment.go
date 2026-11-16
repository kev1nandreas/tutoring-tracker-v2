package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/usecase"
	"gorm.io/gorm"
)

func NewAttachmentUsecase(db *gorm.DB, notifier usecase.MaterialNotifier) usecase.AttachmentUsecase {
	repo := repository.NewAttachmentPostgresRepository(db)
	return usecase.NewAttachmentUsecase(repo, notifier)
}
