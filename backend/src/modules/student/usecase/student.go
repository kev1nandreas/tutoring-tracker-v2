package usecase

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/cache"
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

// studentTTL: attendance, homework and grades are aggregated per student. Every write
// invalidates the cache, so the TTL only bounds changes made outside the app (manual SQL).
const studentTTL = 24 * time.Hour

type studentUsecase struct {
	repo  repository.StudentRepository
	cache *cache.Cache
}

// NewStudentUsecase builds the usecase. c may be nil (no caching).
func NewStudentUsecase(repo repository.StudentRepository, c *cache.Cache) StudentUsecase {
	return &studentUsecase{repo: repo, cache: c}
}

// scope is the tutor whose students are shown; an admin gets uuid.Nil (every tutor's).
func scope(callerID uuid.UUID, role string) uuid.UUID {
	if role == "admin" {
		return uuid.Nil
	}
	return callerID
}

type listResult struct {
	Rows []dto.StudentRow
	Meta pagination.Meta
}

func (u *studentUsecase) List(callerID uuid.UUID, role, search string, params pagination.Params) ([]dto.StudentRow, pagination.Meta, error) {
	if role != "tutor" && role != "admin" {
		return nil, pagination.Meta{}, ErrForbidden
	}
	callerID = scope(callerID, role)
	search = strings.TrimSpace(search)
	key := fmt.Sprintf("list:%s:%s:%+v", callerID, search, params)
	res, err := cache.Remember(u.cache, cache.NSStudents, key, studentTTL, func() (listResult, error) {
		rows, meta, err := u.repo.List(callerID, search, params)
		return listResult{Rows: rows, Meta: meta}, err
	})
	return res.Rows, res.Meta, err
}

func (u *studentUsecase) Detail(callerID uuid.UUID, role, studentID string) (*dto.StudentDetail, error) {
	if role != "tutor" && role != "admin" {
		return nil, ErrForbidden
	}
	callerID = scope(callerID, role)
	sid, err := uuid.Parse(studentID)
	if err != nil {
		return nil, ErrNotFound
	}
	d, err := cache.Remember(u.cache, cache.NSStudents, fmt.Sprintf("detail:%s:%s", callerID, sid), studentTTL,
		func() (*dto.StudentDetail, error) { return u.repo.Detail(callerID, sid) })
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return d, err
}
