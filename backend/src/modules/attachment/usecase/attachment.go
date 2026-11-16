package usecase

import (
	"context"
	"errors"
	"fmt"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/objstore"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var (
	// ErrMeetingNotFound is also returned for meetings the caller may not see.
	ErrMeetingNotFound    = errors.New("meeting not found")
	ErrAttachmentNotFound = errors.New("attachment not found")
	ErrForbidden          = errors.New("you are not allowed to do this")
	ErrBadRequest         = errors.New("bad request")
	// ErrStorage means the file storage could not be reached or refused the check.
	ErrStorage = errors.New("file storage unavailable")
)

// MaterialNotifier is told whenever material is added to a meeting.
type MaterialNotifier interface {
	MeetingMaterialAdded(meetingID uuid.UUID, count int)
}

// ObjectStore is the file storage (MinIO). Keys are never accepted from clients as-is.
type ObjectStore interface {
	PresignedPost(ctx context.Context, key, contentType string, maxBytes int64) (url string, fields map[string]string, err error)
	StatSize(ctx context.Context, key string) (int64, error)
	PresignedDownload(ctx context.Context, key, filename, contentType string, inline bool) (url string, err error)
	Remove(ctx context.Context, key string) error
}

type attachmentUsecase struct {
	repo     repository.AttachmentRepository
	notifier MaterialNotifier
	store    ObjectStore
	// uploadTTL / downloadTTL are only reported back to clients as expires_in.
	uploadTTL, downloadTTL time.Duration
}

func NewAttachmentUsecase(repo repository.AttachmentRepository, notifier MaterialNotifier, store ObjectStore, uploadTTL, downloadTTL time.Duration) AttachmentUsecase {
	return &attachmentUsecase{repo: repo, notifier: notifier, store: store, uploadTTL: uploadTTL, downloadTTL: downloadTTL}
}

// keyPrefix is where all files of a meeting live in the bucket.
func keyPrefix(meetingID uuid.UUID) string { return "meetings/" + meetingID.String() + "/" }

// access finds the meeting and decides whether the caller may read (write=false) or
// change (write=true) its files.
func (u *attachmentUsecase) access(meetingID string, callerID uuid.UUID, role string, write bool) (uuid.UUID, error) {
	id, err := uuid.Parse(meetingID)
	if err != nil {
		return uuid.Nil, ErrMeetingNotFound
	}
	a, err := u.repo.MeetingAccess(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return uuid.Nil, ErrMeetingNotFound
		}
		return uuid.Nil, err
	}

	switch role {
	case "admin":
		return id, nil
	case "tutor":
		// someone else's meeting looks the same as a missing one
		if a.CreatedBy == nil || *a.CreatedBy != callerID {
			return uuid.Nil, ErrMeetingNotFound
		}
		return id, nil
	case "student":
		if write {
			return uuid.Nil, ErrForbidden
		}
		ok, err := u.repo.IsAcceptedStudent(a.TutorialID, callerID)
		if err != nil {
			return uuid.Nil, err
		}
		if !ok {
			return uuid.Nil, ErrMeetingNotFound
		}
		return id, nil
	default:
		return uuid.Nil, ErrForbidden
	}
}

func (u *attachmentUsecase) FindByMeetingID(meetingID string, callerID uuid.UUID, role string, params pagination.Params) ([]dto.AttachmentResponse, pagination.Meta, error) {
	id, err := u.access(meetingID, callerID, role, false)
	if err != nil {
		return nil, pagination.Meta{}, err
	}
	items, meta, err := u.repo.FindByMeetingID(id, params)
	if err != nil {
		return nil, pagination.Meta{}, err
	}
	out := make([]dto.AttachmentResponse, len(items))
	for i, it := range items {
		out[i] = dto.ToAttachmentResponse(it)
	}
	return out, meta, nil
}

func (u *attachmentUsecase) PrepareUpload(ctx context.Context, meetingID string, callerID uuid.UUID, role string, req dto.UploadTicketRequest) (*dto.UploadTicket, error) {
	id, err := u.access(meetingID, callerID, role, true)
	if err != nil {
		return nil, err
	}

	contentType, err := dto.ContentTypeFor(req.Type, req.Name)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadRequest, err)
	}
	max := dto.MaxBytes[req.Type]
	if req.Size > max {
		return nil, fmt.Errorf("%w: a %s file can be at most %d MB", ErrBadRequest, req.Type, max>>20)
	}

	// the name only matters for display; the key is random so it can never collide or escape
	key := keyPrefix(id) + uuid.NewString() + dto.Ext(req.Name)
	postURL, fields, err := u.store.PresignedPost(ctx, key, contentType, max)
	if err != nil {
		return nil, err
	}

	return &dto.UploadTicket{
		UploadURL:   postURL,
		Fields:      fields,
		Key:         key,
		ContentType: contentType,
		ExpiresIn:   int(u.uploadTTL.Seconds()),
	}, nil
}

func (u *attachmentUsecase) CompleteUploads(ctx context.Context, meetingID string, callerID uuid.UUID, role string, req dto.CompleteUploadsRequest) ([]dto.AttachmentResponse, error) {
	id, err := u.access(meetingID, callerID, role, true)
	if err != nil {
		return nil, err
	}

	prefix := keyPrefix(id)
	rows := make([]entity.Attachment, len(req.Items))
	for i, in := range req.Items {
		// only keys under this meeting; the extension must still fit the category
		if !strings.HasPrefix(in.Key, prefix) || strings.Contains(in.Key, "..") {
			return nil, fmt.Errorf("%w: invalid file key", ErrBadRequest)
		}
		contentType, err := dto.ContentTypeFor(in.Type, in.Key)
		if err != nil {
			return nil, fmt.Errorf("%w: %v", ErrBadRequest, err)
		}
		if exists, err := u.repo.LinkExists(in.Key); err != nil {
			return nil, err
		} else if exists {
			return nil, fmt.Errorf("%w: %q was already saved", ErrBadRequest, in.Name)
		}

		// trust the storage, not the client: the file must exist, and its real size is kept
		size, err := objstore.StatWithRetry(ctx, u.store.StatSize, in.Key)
		if err != nil {
			if errors.Is(err, objstore.ErrNotFound) {
				return nil, fmt.Errorf("%w: %q was not uploaded", ErrBadRequest, in.Name)
			}
			return nil, fmt.Errorf("could not check %q, please try again: %w", in.Name, ErrStorage)
		}
		if size > dto.MaxBytes[in.Type] {
			_ = u.store.Remove(ctx, in.Key)
			return nil, fmt.Errorf("%w: %q is too large", ErrBadRequest, in.Name)
		}

		rows[i] = entity.Attachment{
			MeetingID:   id,
			CreatedBy:   &callerID,
			Name:        in.Name,
			Type:        in.Type,
			Link:        in.Key,
			ContentType: contentType,
			Size:        size,
		}
	}

	if err := u.repo.CreateBatch(rows); err != nil {
		return nil, err
	}
	u.notifier.MeetingMaterialAdded(id, len(rows))

	out := make([]dto.AttachmentResponse, len(rows))
	for i, r := range rows {
		out[i] = dto.ToAttachmentResponse(r)
	}
	return out, nil
}

func (u *attachmentUsecase) load(id string) (*entity.Attachment, error) {
	aid, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrAttachmentNotFound
	}
	a, err := u.repo.FindByID(aid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttachmentNotFound
		}
		return nil, err
	}
	return a, nil
}

func (u *attachmentUsecase) DownloadURL(ctx context.Context, id string, callerID uuid.UUID, role string, wantInline bool) (*dto.DownloadResponse, error) {
	a, err := u.load(id)
	if err != nil {
		return nil, err
	}
	if _, err := u.access(a.MeetingID.String(), callerID, role, false); err != nil {
		// do not reveal that the file exists
		if errors.Is(err, ErrMeetingNotFound) {
			return nil, ErrAttachmentNotFound
		}
		return nil, err
	}

	resp := &dto.DownloadResponse{Name: a.Name, Type: a.Type, ContentType: a.ContentType, ExpiresIn: int(u.downloadTTL.Seconds())}

	if dto.IsExternalLink(a.Link) { // old rows that point at a web link
		resp.URL = a.Link
		return resp, nil
	}

	inline := wantInline && dto.CanOpenInline(a.ContentType)
	link, err := u.store.PresignedDownload(ctx, a.Link, a.Name, a.ContentType, inline)
	if err != nil {
		return nil, err
	}
	resp.URL = link
	resp.Inline = inline
	return resp, nil
}

func (u *attachmentUsecase) Delete(ctx context.Context, id string, callerID uuid.UUID, role string) error {
	a, err := u.load(id)
	if err != nil {
		return err
	}
	if _, err := u.access(a.MeetingID.String(), callerID, role, true); err != nil {
		if errors.Is(err, ErrMeetingNotFound) {
			return ErrAttachmentNotFound
		}
		return err
	}

	if err := u.repo.Delete(a); err != nil {
		return err
	}
	if !dto.IsExternalLink(a.Link) {
		_ = u.store.Remove(ctx, a.Link) // best effort: the row is already gone
	}
	return nil
}
