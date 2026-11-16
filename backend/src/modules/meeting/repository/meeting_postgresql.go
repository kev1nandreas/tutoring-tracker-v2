package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var meetingSortColumns = map[string]bool{
	"id":            true,
	"tutorial_id":   true,
	"title":         true,
	"date":          true,
	"youtube_link":  true,
	"time_start":    true,
	"time_end":      true,
	"is_done":       true,
	"marks":         true,
	"has_homework":  true,
	"text_homework": true,
	"created_at":    true,
	"updated_at":    true,
}

type meetingPostgresRepository struct {
	db *gorm.DB
}

func NewMeetingPostgresRepository(db *gorm.DB) MeetingRepository {
	return &meetingPostgresRepository{db: db}
}

func (r *meetingPostgresRepository) FindAll(params pagination.Params) ([]entity.Meeting, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !meetingSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Meeting
	if _, meta, err := params.ApplyFiltered(r.db, &items, meetingSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *meetingPostgresRepository) FindByTutorialID(tutorialID string, params pagination.Params) ([]entity.Meeting, pagination.Meta, error) {
	if !meetingSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Meeting
	if _, meta, err := params.ApplyFiltered(r.db.Where("tutorial_id = ?", tutorialID), &items, meetingSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *meetingPostgresRepository) FindByID(id string) (*entity.Meeting, error) {
	var meeting entity.Meeting
	if err := r.db.Where("id = ?", id).First(&meeting).Error; err != nil {
		return nil, err
	}
	return &meeting, nil
}

func (r *meetingPostgresRepository) Create(meeting *entity.Meeting) error {
	return r.db.Create(meeting).Error
}

func (r *meetingPostgresRepository) Update(meeting *entity.Meeting) error {
	return r.db.Save(meeting).Error
}

func (r *meetingPostgresRepository) Delete(meeting *entity.Meeting) error {
	return r.db.Delete(meeting).Error
}

func (r *meetingPostgresRepository) TutorialCreator(tutorialID string) (*uuid.UUID, error) {
	var row struct{ CreatedBy *uuid.UUID }
	res := r.db.Table("tutorials").Select("created_by").Where("id = ?", tutorialID).Limit(1).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return row.CreatedBy, nil
}
