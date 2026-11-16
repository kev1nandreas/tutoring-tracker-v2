package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type AttachmentRepository interface {
	MeetingExists(meetingID uuid.UUID) (bool, error)
	FindByMeetingID(meetingID uuid.UUID, params pagination.Params) ([]entity.Attachment, pagination.Meta, error)
	FindByID(id uuid.UUID) (*entity.Attachment, error)
	// CreateBatch inserts all attachments in one statement (all or nothing).
	CreateBatch(attachments []entity.Attachment) error
	Delete(attachment *entity.Attachment) error
}
