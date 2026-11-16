package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/job/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var jobSortColumns = map[string]bool{
	"id":         true,
	"is_success": true,
	"messages":   true,
	"start_time": true,
	"end_time":   true,
	"created_at": true,
	"updated_at": true,
}

type jobPostgresRepository struct {
	db *gorm.DB
}

func NewJobPostgresRepository(db *gorm.DB) JobRepository {
	return &jobPostgresRepository{db: db}
}

func (r *jobPostgresRepository) FindAll(params pagination.Params) ([]entity.Job, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !jobSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Job
	if _, meta, err := params.ApplyFiltered(r.db, &items, jobSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *jobPostgresRepository) FindByID(id string) (*entity.Job, error) {
	var job entity.Job
	if err := r.db.Where("id = ?", id).First(&job).Error; err != nil {
		return nil, err
	}
	return &job, nil
}
