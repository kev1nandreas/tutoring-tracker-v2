package usecase

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var (
	ErrForbidden = errors.New("only a tutor can see students")
	ErrNotFound  = errors.New("student not found")
)

type StudentUsecase interface {
	List(callerID uuid.UUID, role, search string, params pagination.Params) ([]dto.StudentRow, pagination.Meta, error)
	Detail(callerID uuid.UUID, role, studentID string) (*dto.StudentDetail, error)
}

type studentUsecase struct{ repo repository.StudentRepository }

func NewStudentUsecase(repo repository.StudentRepository) StudentUsecase {
	return &studentUsecase{repo: repo}
}

func (u *studentUsecase) List(callerID uuid.UUID, role, search string, params pagination.Params) ([]dto.StudentRow, pagination.Meta, error) {
	if role != "tutor" {
		return nil, pagination.Meta{}, ErrForbidden
	}
	return u.repo.List(callerID, strings.TrimSpace(search), params)
}

func (u *studentUsecase) Detail(callerID uuid.UUID, role, studentID string) (*dto.StudentDetail, error) {
	if role != "tutor" {
		return nil, ErrForbidden
	}
	sid, err := uuid.Parse(studentID)
	if err != nil {
		return nil, ErrNotFound
	}
	d, err := u.repo.Detail(callerID, sid)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return d, err
}
