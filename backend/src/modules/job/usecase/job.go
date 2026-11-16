package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type jobUsecase struct {
	repo repository.JobRepository
}

func NewJobUsecase(repo repository.JobRepository) JobUsecase {
	return &jobUsecase{repo: repo}
}

func (u *jobUsecase) FindAll(params pagination.Params) ([]entity.Job, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *jobUsecase) FindByID(id string) (*entity.Job, error) {
	return u.repo.FindByID(id)
}
