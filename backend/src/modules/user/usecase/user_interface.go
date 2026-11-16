package usecase

import (
	"context"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type UserUsecase interface {
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	// LoginWithGoogle signs in the owner of a verified Google email; a new email becomes a student.
	LoginWithGoogle(ctx context.Context, idToken string) (*dto.LoginResponse, error)
	Me(username string) (*dto.MeResponse, error)
	Register(req dto.RegisterRequest) (*entity.User, error)
	RegisterTutor(callerUsername string, req dto.RegisterRequest) (*entity.User, error)
	FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error)
	FindByID(id string) (*entity.User, error)
	Update(id string, req dto.UpdateUserRequest) (*entity.User, error)
	Delete(id string) error
}
