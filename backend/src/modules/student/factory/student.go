package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/usecase"
	"gorm.io/gorm"
)

func NewStudentUsecase(db *gorm.DB) usecase.StudentUsecase {
	return usecase.NewStudentUsecase(repository.NewStudentPostgresRepository(db))
}
