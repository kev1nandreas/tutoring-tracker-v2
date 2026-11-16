package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
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

func (r *attachmentPostgresRepository) MeetingExists(meetingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&meetingEntity.Meeting{}).Where("id = ?", meetingID).Count(&count).Error
	return count > 0, err
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
