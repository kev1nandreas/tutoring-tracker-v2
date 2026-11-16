package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var tutorialSortColumns = map[string]bool{
	"id":              true,
	"custom_id":       true,
	"name":            true,
	"date_started":    true,
	"date_ended":      true,
	"meeting_days":    true,
	"is_done":         true,
	"description":     true,
	"show_download":   true,
	"show_attendance": true,
	"show_feedback":   true,
	"created_at":      true,
	"updated_at":      true,
}

type tutorialPostgresRepository struct {
	db *gorm.DB
}

func NewTutorialPostgresRepository(db *gorm.DB) TutorialRepository {
	return &tutorialPostgresRepository{db: db}
}

func (r *tutorialPostgresRepository) FindAll(params pagination.Params) ([]entity.Tutorial, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !tutorialSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Tutorial
	if _, meta, err := params.ApplyFiltered(r.db, &items, tutorialSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *tutorialPostgresRepository) FindByID(id string) (*entity.Tutorial, error) {
	var tutorial entity.Tutorial
	if err := r.db.Where("id = ?", id).First(&tutorial).Error; err != nil {
		return nil, err
	}
	return &tutorial, nil
}

func (r *tutorialPostgresRepository) Create(tutorial *entity.Tutorial) error {
	return r.db.Create(tutorial).Error
}

func (r *tutorialPostgresRepository) Update(tutorial *entity.Tutorial) error {
	return r.db.Save(tutorial).Error
}

func (r *tutorialPostgresRepository) Delete(tutorial *entity.Tutorial) error {
	return r.db.Delete(tutorial).Error
}

func (r *tutorialPostgresRepository) ExistsByCustomID(customID string) (bool, error) {
	var count int64
	err := r.db.Model(&entity.Tutorial{}).Where("custom_id = ?", customID).Count(&count).Error
	return count > 0, err
}
