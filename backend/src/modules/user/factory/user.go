package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/googleauth"
	"gorm.io/gorm"
)

// NewUserUsecase builds the user usecase. google may be nil, which disables Google login.
func NewUserUsecase(db *gorm.DB, google *googleauth.Verifier) usecase.UserUsecase {
	repo := repository.NewUserPostgresRepository(db)
	if google == nil { // avoid a non-nil interface holding a nil pointer
		return usecase.NewUserUsecase(repo, nil)
	}
	return usecase.NewUserUsecase(repo, google)
}
