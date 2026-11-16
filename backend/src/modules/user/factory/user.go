package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/googleauth"
	"gorm.io/gorm"
)

// NewUserUsecase builds the user usecase. google may be nil (no Google login); mailer may be nil (no reset emails).
func NewUserUsecase(db *gorm.DB, google *googleauth.Verifier, mailer usecase.Mailer, frontendURL string) usecase.UserUsecase {
	repo := repository.NewUserPostgresRepository(db)
	if google == nil { // avoid a non-nil interface holding a nil pointer
		return usecase.NewUserUsecase(repo, nil, mailer, frontendURL)
	}
	return usecase.NewUserUsecase(repo, google, mailer, frontendURL)
}
