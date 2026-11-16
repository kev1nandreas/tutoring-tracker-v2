package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var attachmentSortColumns = map[string]bool{
	"id":         true,
	"name":       true,
	"type":       true,
	"link":       true,
	"created_by": true,
	"created_at": true,
	"updated_at": true,
}

type attachmentPostgresRepository struct {
	db *gorm.DB
}

func NewAttachmentPostgresRepository(db *gorm.DB) AttachmentRepository {
	return &attachmentPostgresRepository{db: db}
}

func (r *attachmentPostgresRepository) MeetingAccess(meetingID uuid.UUID) (*MeetingAccess, error) {
	var row struct {
		TutorialID uuid.UUID
		CreatedBy  *uuid.UUID
	}
	res := r.db.Table("meetings").
		Select("tutorials.id AS tutorial_id, tutorials.created_by AS created_by").
		Joins("JOIN tutorials ON tutorials.id = meetings.tutorial_id").
		Where("meetings.id = ?", meetingID).
		Limit(1).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &MeetingAccess{TutorialID: row.TutorialID, CreatedBy: row.CreatedBy}, nil
}

func (r *attachmentPostgresRepository) IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error) {
	var n int64
	err := r.db.Table("pending_validations").
		Where("tutorial_id = ? AND user_id = ? AND is_validated = 1", tutorialID, userID).
		Count(&n).Error
	return n > 0, err
}

func (r *attachmentPostgresRepository) LinkExists(link string) (bool, error) {
	var n int64
	err := r.db.Model(&entity.Attachment{}).Where("link = ?", link).Count(&n).Error
	return n > 0, err
}

func (r *attachmentPostgresRepository) FindByMeetingID(meetingID uuid.UUID, params pagination.Params) ([]entity.Attachment, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !attachmentSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.Attachment
	if _, meta, err := params.ApplyFiltered(r.db.Where("meeting_id = ?", meetingID), &items, attachmentSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *attachmentPostgresRepository) FindByID(id uuid.UUID) (*entity.Attachment, error) {
	var attachment entity.Attachment
	if err := r.db.Where("id = ?", id).First(&attachment).Error; err != nil {
		return nil, err
	}
	return &attachment, nil
}

func (r *attachmentPostgresRepository) CreateBatch(attachments []entity.Attachment) error {
	return r.db.Create(&attachments).Error
}

func (r *attachmentPostgresRepository) Delete(attachment *entity.Attachment) error {
	return r.db.Delete(attachment).Error
}
