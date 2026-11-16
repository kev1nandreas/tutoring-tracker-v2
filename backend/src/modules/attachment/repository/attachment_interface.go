package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

// MeetingAccess is what is needed to decide who may touch a meeting's files.
type MeetingAccess struct {
	TutorialID uuid.UUID
	// CreatedBy is the tutor who owns the tutorial (nil when unset).
	CreatedBy *uuid.UUID
}

type AttachmentRepository interface {
	// MeetingAccess returns gorm.ErrRecordNotFound when the meeting does not exist.
	MeetingAccess(meetingID uuid.UUID) (*MeetingAccess, error)
	IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error)
	FindByMeetingID(meetingID uuid.UUID, params pagination.Params) ([]entity.Attachment, pagination.Meta, error)
	FindByID(id uuid.UUID) (*entity.Attachment, error)
	LinkExists(link string) (bool, error)
	// CreateBatch inserts all attachments in one statement (all or nothing).
	CreateBatch(attachments []entity.Attachment) error
	Delete(attachment *entity.Attachment) error
}
