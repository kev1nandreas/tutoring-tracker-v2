package usecase

import (
	"errors"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

// ErrMeetingNotFound is returned when the meeting id is malformed or unknown.
var ErrMeetingNotFound = errors.New("meeting not found")

var (
	ErrAttachmentNotFound = errors.New("attachment not found")
	ErrForbidden          = errors.New("only the creator can delete this attachment")
)

// MaterialNotifier is told whenever material is added to a meeting.
type MaterialNotifier interface {
	MeetingMaterialAdded(meetingID uuid.UUID, count int)
}

type attachmentUsecase struct {
	repo     repository.AttachmentRepository
	notifier MaterialNotifier
}

func NewAttachmentUsecase(repo repository.AttachmentRepository, notifier MaterialNotifier) AttachmentUsecase {
	return &attachmentUsecase{repo: repo, notifier: notifier}
}

func (u *attachmentUsecase) existingMeeting(meetingID string) (uuid.UUID, error) {
	id, err := uuid.Parse(meetingID)
	if err != nil {
		return uuid.Nil, ErrMeetingNotFound
	}
	ok, err := u.repo.MeetingExists(id)
	if err != nil {
		return uuid.Nil, err
	}
	if !ok {
		return uuid.Nil, ErrMeetingNotFound
	}
	return id, nil
}

func (u *attachmentUsecase) FindByMeetingID(meetingID string, params pagination.Params) ([]entity.Attachment, pagination.Meta, error) {
	id, err := u.existingMeeting(meetingID)
	if err != nil {
		return nil, pagination.Meta{}, err
	}
	return u.repo.FindByMeetingID(id, params)
}

func (u *attachmentUsecase) CreateBatch(meetingID string, creatorID uuid.UUID, req dto.CreateAttachmentsRequest) ([]entity.Attachment, error) {
	id, err := u.existingMeeting(meetingID)
	if err != nil {
		return nil, err
	}

	items := make([]entity.Attachment, len(req.Attachments))
	for i, in := range req.Attachments {
		items[i] = entity.Attachment{
			MeetingID: id,
			CreatedBy: &creatorID,
			Name:      in.Name,
			Type:      in.Type,
			Link:      in.Link,
		}
	}

	if err := u.repo.CreateBatch(items); err != nil {
		return nil, err
	}

	u.notifier.MeetingMaterialAdded(id, len(items))

	return items, nil
}

func (u *attachmentUsecase) Delete(id string, callerID uuid.UUID) error {
	aid, err := uuid.Parse(id)
	if err != nil {
		return ErrAttachmentNotFound
	}

	attachment, err := u.repo.FindByID(aid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAttachmentNotFound
		}
		return err
	}

	if attachment.CreatedBy == nil || *attachment.CreatedBy != callerID {
		return ErrForbidden
	}

	return u.repo.Delete(attachment)
}
