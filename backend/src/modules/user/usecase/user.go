package usecase

import (
	"errors"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/user/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/auth"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"golang.org/x/crypto/bcrypt"
)

type userUsecase struct {
	repo repository.UserRepository
}

func NewUserUsecase(repo repository.UserRepository) UserUsecase {
	return &userUsecase{repo: repo}
}

func (u *userUsecase) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	user, err := u.repo.FindByUsername(req.Username)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid username or password")
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email, user.Role.Name)
	if err != nil {
		return nil, errors.New("error generating token")
	}

	return &dto.LoginResponse{Token: token}, nil
}

const (
	roleStudent = "student"
	roleTutor   = "tutor"
)

// ErrForbidden is returned when the caller is not allowed to perform the action.
var ErrForbidden = errors.New("only a tutor can register a tutor")

// Register creates a public account; the role is always student.
func (u *userUsecase) Register(req dto.RegisterRequest) (*entity.User, error) {
	return u.createWithRole(roleStudent, req)
}

// RegisterTutor creates a tutor account. Only an existing tutor may do this.
func (u *userUsecase) RegisterTutor(callerUsername string, req dto.RegisterRequest) (*entity.User, error) {
	caller, err := u.repo.FindByUsername(callerUsername)
	if err != nil {
		return nil, ErrForbidden
	}
	tutorRole, err := u.repo.FindRoleByName(roleTutor)
	if err != nil {
		return nil, errors.New("tutor role not found")
	}
	if caller.RoleID != tutorRole.ID {
		return nil, ErrForbidden
	}

	return u.createWithRole(roleTutor, req)
}

func (u *userUsecase) createWithRole(roleName string, req dto.RegisterRequest) (*entity.User, error) {
	role, err := u.repo.FindRoleByName(roleName)
	if err != nil {
		return nil, errors.New(roleName + " role not found")
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("could not hash password")
	}

	user := &entity.User{
		RoleID:   role.ID,
		Name:     req.Name,
		School:   req.School,
		Phone:    req.Phone,
		Email:    req.Email,
		Username: req.Username,
		Password: hashedPassword,
	}

	if err := u.repo.Create(user); err != nil {
		return nil, errors.New("could not save user")
	}

	return user, nil
}

func (u *userUsecase) FindAll(params pagination.Params) ([]entity.User, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *userUsecase) FindByID(id string) (*entity.User, error) {
	return u.repo.FindByID(id)
}

func (u *userUsecase) Update(id string, req dto.UpdateUserRequest) (*entity.User, error) {
	user, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.RoleID != nil {
		user.RoleID = *req.RoleID
	}
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.School != nil {
		user.School = *req.School
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Password != nil {
		hashed, err := auth.HashPassword(*req.Password)
		if err != nil {
			return nil, errors.New("could not hash password")
		}
		user.Password = hashed
	}

	if err := u.repo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (u *userUsecase) Delete(id string) error {
	user, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	return u.repo.Delete(user)
}
