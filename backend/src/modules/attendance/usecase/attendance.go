package usecase

import (
	"context"
	"errors"
	"fmt"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/objstore"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/repository"
	"gorm.io/gorm"
)

var (
	// ErrMeetingNotFound is also returned for meetings the caller may not see.
	ErrMeetingNotFound = errors.New("meeting not found")
	ErrForbidden       = errors.New("you are not allowed to do this")
	ErrAttendanceOff   = errors.New("attendance is turned off for this class")
	ErrNotToday        = errors.New("attendance can only be marked on the day of the meeting")
	ErrBadRequest      = errors.New("bad request")
	// ErrStorage means the file storage could not be reached or refused the check.
	ErrStorage = errors.New("file storage unavailable")
)

// ObjectStore is the file storage (MinIO).
type ObjectStore interface {
	PresignedPost(ctx context.Context, key, contentType string, maxBytes int64) (url string, fields map[string]string, err error)
	StatSize(ctx context.Context, key string) (int64, error)
	PresignedDownload(ctx context.Context, key, filename, contentType string, inline bool) (url string, err error)
	Remove(ctx context.Context, key string) error
}

type attendanceUsecase struct {
	repo    repository.AttendanceRepository
	store   ObjectStore
	loc     *time.Location
	nowFunc func() time.Time // replaced in tests
	uploadT time.Duration
}

func NewAttendanceUsecase(repo repository.AttendanceRepository, store ObjectStore, uploadTTL time.Duration) AttendanceUsecase {
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return &attendanceUsecase{repo: repo, store: store, loc: loc, nowFunc: time.Now, uploadT: uploadTTL}
}

// photoPrefix is where a meeting's attendance photos live. It sits under meetings/<id>/,
// so deleting the meeting (or its tutorial) removes the photos with the other files.
func photoPrefix(meetingID uuid.UUID) string {
	return "meetings/" + meetingID.String() + "/attendance/"
}

func (u *attendanceUsecase) today() string { return u.nowFunc().In(u.loc).Format("2006-01-02") }

// meeting finds the meeting, checks the caller may see it as a student of the class
// (student=true) or as its tutor/admin (student=false), then that attendance is on.
func (u *attendanceUsecase) meeting(meetingID string, userID uuid.UUID, role string, student bool) (uuid.UUID, *repository.MeetingInfo, error) {
	id, err := uuid.Parse(meetingID)
	if err != nil {
		return uuid.Nil, nil, ErrMeetingNotFound
	}
	info, err := u.repo.MeetingInfo(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return uuid.Nil, nil, ErrMeetingNotFound
		}
		return uuid.Nil, nil, err
	}

	switch {
	case student && role == "student":
		ok, err := u.repo.IsAcceptedStudent(info.TutorialID, userID)
		if err != nil {
			return uuid.Nil, nil, err
		}
		if !ok {
			return uuid.Nil, nil, ErrMeetingNotFound // someone else's class looks like a missing one
		}
	case !student && role == "admin":
	case !student && role == "tutor":
		if info.CreatedBy == nil || *info.CreatedBy != userID {
			return uuid.Nil, nil, ErrMeetingNotFound
		}
	default:
		return uuid.Nil, nil, ErrForbidden
	}

	// with the switch off there is no attendance for anyone
	if !info.ShowAttendance {
		return uuid.Nil, nil, ErrAttendanceOff
	}
	return id, info, nil
}

func (u *attendanceUsecase) PrepareUpload(ctx context.Context, meetingID string, userID uuid.UUID, role string, req dto.UploadTicketRequest) (*dto.UploadTicket, error) {
	id, info, err := u.meeting(meetingID, userID, role, true)
	if err != nil {
		return nil, err
	}
	if info.Date != u.today() {
		return nil, ErrNotToday
	}

	contentType, err := dto.PhotoContentType(req.Name)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadRequest, err)
	}
	if req.Size > dto.MaxPhotoBytes {
		return nil, fmt.Errorf("%w: the photo can be at most %d MB", ErrBadRequest, dto.MaxPhotoBytes>>20)
	}

	key := photoPrefix(id) + uuid.NewString() + dto.Ext(req.Name)
	postURL, fields, err := u.store.PresignedPost(ctx, key, contentType, dto.MaxPhotoBytes)
	if err != nil {
		return nil, err
	}
	return &dto.UploadTicket{UploadURL: postURL, Fields: fields, Key: key, ContentType: contentType, ExpiresIn: int(u.uploadT.Seconds())}, nil
}

func (u *attendanceUsecase) Mark(ctx context.Context, meetingID string, userID uuid.UUID, role string, req dto.MarkRequest) (*dto.MyAttendance, error) {
	id, info, err := u.meeting(meetingID, userID, role, true)
	if err != nil {
		return nil, err
	}
	if info.Date != u.today() {
		return nil, ErrNotToday
	}

	// only a photo uploaded for this meeting's attendance
	if !strings.HasPrefix(req.Key, photoPrefix(id)) || strings.Contains(req.Key, "..") {
		return nil, fmt.Errorf("%w: invalid photo key", ErrBadRequest)
	}
	contentType, err := dto.PhotoContentType(req.Key)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadRequest, err)
	}
	size, err := objstore.StatWithRetry(ctx, u.store.StatSize, req.Key) // trust the storage, not the client
	if err != nil {
		if errors.Is(err, objstore.ErrNotFound) {
			return nil, fmt.Errorf("%w: the photo was not uploaded", ErrBadRequest)
		}
		return nil, fmt.Errorf("could not check the uploaded photo, please try again: %w", ErrStorage)
	}
	if size > dto.MaxPhotoBytes {
		_ = u.store.Remove(ctx, req.Key)
		return nil, fmt.Errorf("%w: the photo is too large", ErrBadRequest)
	}

	previous, findErr := u.repo.Find(id, userID)
	rec := &entity.Attendance{MeetingID: id, UserID: userID, PhotoKey: req.Key, ContentType: contentType, Size: size}
	if err := u.repo.Save(rec); err != nil {
		return nil, err
	}
	// a replaced photo is no longer needed (best effort: the record already points to the new one)
	if findErr == nil && previous.PhotoKey != req.Key {
		_ = u.store.Remove(ctx, previous.PhotoKey)
	}

	return u.Mine(ctx, meetingID, userID, role)
}

func (u *attendanceUsecase) Mine(ctx context.Context, meetingID string, userID uuid.UUID, role string) (*dto.MyAttendance, error) {
	id, info, err := u.meeting(meetingID, userID, role, true)
	if err != nil {
		return nil, err
	}

	out := &dto.MyAttendance{CanMark: info.Date == u.today()}
	rec, err := u.repo.Find(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return out, nil
		}
		return nil, err
	}

	out.Marked, out.MarkedAt = true, &rec.UpdatedAt
	if link, err := u.store.PresignedDownload(ctx, rec.PhotoKey, "attendance"+dto.Ext(rec.PhotoKey), rec.ContentType, true); err == nil {
		out.PhotoURL = link
	}
	return out, nil
}

func (u *attendanceUsecase) Roster(ctx context.Context, meetingID string, userID uuid.UUID, role string) (*dto.Roster, error) {
	id, info, err := u.meeting(meetingID, userID, role, false)
	if err != nil {
		return nil, err
	}
	rows, err := u.repo.Roster(id, info.TutorialID)
	if err != nil {
		return nil, err
	}

	out := &dto.Roster{Total: len(rows), Students: make([]dto.StudentAttendance, len(rows))}
	for i, r := range rows {
		s := dto.StudentAttendance{UserID: r.UserID.String(), Name: r.Name, Username: r.Username, Present: r.HasRecord, MarkedAt: r.MarkedAt}
		if r.HasRecord {
			out.Present++
			if link, err := u.store.PresignedDownload(ctx, r.PhotoKey, "attendance-"+r.Username+dto.Ext(r.PhotoKey), "image/jpeg", true); err == nil {
				s.PhotoURL = link
			}
		}
		out.Students[i] = s
	}
	return out, nil
}
