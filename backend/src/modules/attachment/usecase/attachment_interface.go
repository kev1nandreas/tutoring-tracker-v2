package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type AttachmentUsecase interface {
	FindByMeetingID(meetingID string, params pagination.Params) ([]entity.Attachment, pagination.Meta, error)
	CreateBatch(meetingID string, creatorID uuid.UUID, req dto.CreateAttachmentsRequest) ([]entity.Attachment, error)
	// Delete removes an attachment; only its creator may do so.
	Delete(id string, callerID uuid.UUID) error
}
