package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type JobRepository interface {
	FindAll(params pagination.Params) ([]entity.Job, pagination.Meta, error)
	FindByID(id string) (*entity.Job, error)
}
