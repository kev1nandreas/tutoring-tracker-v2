package repository

import (
	"github.com/google/uuid"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var submissionSortColumns = map[string]bool{
	"id":         true,
	"user_id":    true,
	"answer":     true,
	"files":      true,
	"created_at": true,
	"updated_at": true,
}

type submissionPostgresRepository struct {
	db *gorm.DB
}

func NewSubmissionPostgresRepository(db *gorm.DB) SubmissionRepository {
	return &submissionPostgresRepository{db: db}
}

func (r *submissionPostgresRepository) MeetingExists(meetingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&meetingEntity.Meeting{}).Where("id = ?", meetingID).Count(&count).Error
	return count > 0, err
}

func (r *submissionPostgresRepository) FindByMeetingID(meetingID uuid.UUID, userID *uuid.UUID, params pagination.Params) ([]entity.Submission, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !submissionSortColumns[params.Sort] {
		params.Sort = ""
	}

	q := r.db.Preload("User").Where("meeting_id = ?", meetingID)
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	}

	var items []entity.Submission
	if _, meta, err := params.ApplyFiltered(q, &items, submissionSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *submissionPostgresRepository) FindByID(id uuid.UUID) (*entity.Submission, error) {
	var submission entity.Submission
	if err := r.db.Preload("User").Where("id = ?", id).First(&submission).Error; err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionPostgresRepository) Create(submission *entity.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionPostgresRepository) Delete(submission *entity.Submission) error {
	return r.db.Delete(submission).Error
}

func (r *submissionPostgresRepository) TutorialCreatorOfMeeting(meetingID uuid.UUID) (*uuid.UUID, error) {
	var row struct{ CreatedBy *uuid.UUID }
	res := r.db.Table("meetings").
		Select("tutorials.created_by AS created_by").
		Joins("JOIN tutorials ON tutorials.id = meetings.tutorial_id").
		Where("meetings.id = ?", meetingID).
		Limit(1).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return row.CreatedBy, nil
}

func (r *submissionPostgresRepository) Update(submission *entity.Submission) error {
	return r.db.Save(submission).Error
}
