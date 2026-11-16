package usecase

import (
	"context"
	"errors"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/objstore"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/repository"
	"gorm.io/gorm"
)

// ---- in-memory fakes ----

type fakeRepo struct {
	missing  bool
	info     repository.MeetingInfo
	accepted map[uuid.UUID]bool
	records  map[uuid.UUID]*entity.Attendance // by user
	roster   []repository.RosterRow
}

func (f *fakeRepo) MeetingInfo(uuid.UUID) (*repository.MeetingInfo, error) {
	if f.missing {
		return nil, gorm.ErrRecordNotFound
	}
	i := f.info
	return &i, nil
}
func (f *fakeRepo) IsAcceptedStudent(_, user uuid.UUID) (bool, error) { return f.accepted[user], nil }
func (f *fakeRepo) Find(_, user uuid.UUID) (*entity.Attendance, error) {
	if r, ok := f.records[user]; ok {
		c := *r
		return &c, nil
	}
	return nil, gorm.ErrRecordNotFound
}
func (f *fakeRepo) Save(a *entity.Attendance) error {
	c := *a
	c.UpdatedAt = time.Now()
	f.records[a.UserID] = &c
	return nil
}
func (f *fakeRepo) Roster(_, _ uuid.UUID) ([]repository.RosterRow, error) { return f.roster, nil }

type fakeStore struct {
	files   map[string]int64
	removed []string
	postMax int64
	statErr error // set to simulate storage being down
}

func (s *fakeStore) PresignedPost(_ context.Context, key, ct string, maxBytes int64) (string, map[string]string, error) {
	s.postMax = maxBytes
	return "http://minio/up", map[string]string{"key": key, "Content-Type": ct}, nil
}
func (s *fakeStore) StatSize(_ context.Context, key string) (int64, error) {
	if s.statErr != nil {
		return 0, s.statErr
	}
	n, ok := s.files[key]
	if !ok {
		return 0, objstore.ErrNotFound
	}
	return n, nil
}
func (s *fakeStore) PresignedDownload(_ context.Context, key, _, _ string, inline bool) (string, error) {
	if !inline {
		return "", errors.New("photos must be served inline")
	}
	return "http://minio/get/" + key, nil
}
func (s *fakeStore) Remove(_ context.Context, key string) error {
	s.removed = append(s.removed, key)
	return nil
}

const today = "2026-11-16"

func setup() (*attendanceUsecase, *fakeRepo, *fakeStore, uuid.UUID, uuid.UUID, uuid.UUID) {
	tutor, student, meeting := uuid.New(), uuid.New(), uuid.New()
	repo := &fakeRepo{
		info:     repository.MeetingInfo{TutorialID: uuid.New(), CreatedBy: &tutor, ShowAttendance: true, Date: today},
		accepted: map[uuid.UUID]bool{student: true},
		records:  map[uuid.UUID]*entity.Attendance{},
	}
	store := &fakeStore{files: map[string]int64{}}
	uc := NewAttendanceUsecase(repo, store, 15*time.Minute).(*attendanceUsecase)
	loc := uc.loc
	uc.nowFunc = func() time.Time { return time.Date(2026, 11, 16, 15, 0, 0, 0, loc) }
	return uc, repo, store, tutor, student, meeting
}

func ticketAndUpload(t *testing.T, uc *attendanceUsecase, store *fakeStore, meeting, student uuid.UUID, name string, size int64) string {
	t.Helper()
	tk, err := uc.PrepareUpload(context.Background(), meeting.String(), student, "student", dto.UploadTicketRequest{Name: name, Size: size})
	if err != nil {
		t.Fatalf("ticket: %v", err)
	}
	store.files[tk.Key] = size // "the browser uploaded it"
	return tk.Key
}

// ---- tests ----

func TestSwitchOffMeansNoAttendanceForAnyone(t *testing.T) {
	uc, repo, _, tutor, student, meeting := setup()
	repo.info.ShowAttendance = false
	ctx, m := context.Background(), meeting.String()

	if _, err := uc.PrepareUpload(ctx, m, student, "student", dto.UploadTicketRequest{Name: "a.jpg", Size: 10}); !errors.Is(err, ErrAttendanceOff) {
		t.Fatalf("ticket: %v", err)
	}
	if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: "x"}); !errors.Is(err, ErrAttendanceOff) {
		t.Fatalf("mark: %v", err)
	}
	if _, err := uc.Mine(ctx, m, student, "student"); !errors.Is(err, ErrAttendanceOff) {
		t.Fatalf("mine: %v", err)
	}
	if _, err := uc.Roster(ctx, m, tutor, "tutor"); !errors.Is(err, ErrAttendanceOff) {
		t.Fatalf("tutor roster: %v", err)
	}
	if len(repo.records) != 0 {
		t.Fatal("nothing may be saved while attendance is off")
	}
}

func TestWhoMayDoWhat(t *testing.T) {
	uc, repo, _, tutor, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()

	// a tutor cannot check in; a student cannot see the roster
	if _, err := uc.PrepareUpload(ctx, m, tutor, "tutor", dto.UploadTicketRequest{Name: "a.jpg", Size: 10}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("tutor ticket: %v", err)
	}
	if _, err := uc.Roster(ctx, m, student, "student"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("student roster: %v", err)
	}
	// a student who is not in the class, and another tutor, see "not found"
	if _, err := uc.Mine(ctx, m, uuid.New(), "student"); !errors.Is(err, ErrMeetingNotFound) {
		t.Fatalf("outsider: %v", err)
	}
	if _, err := uc.Roster(ctx, m, uuid.New(), "tutor"); !errors.Is(err, ErrMeetingNotFound) {
		t.Fatalf("other tutor: %v", err)
	}
	if _, err := uc.Roster(ctx, m, uuid.New(), "admin"); err != nil {
		t.Fatalf("admin roster: %v", err)
	}
	repo.missing = true
	if _, err := uc.Mine(ctx, m, student, "student"); !errors.Is(err, ErrMeetingNotFound) {
		t.Fatalf("missing meeting: %v", err)
	}
	if _, err := uc.Mine(ctx, "nope", student, "student"); !errors.Is(err, ErrMeetingNotFound) {
		t.Fatalf("bad id: %v", err)
	}
}

func TestOnlyOnTheMeetingDay(t *testing.T) {
	uc, repo, _, _, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()

	for _, date := range []string{"2026-11-15", "2026-11-17"} { // yesterday, tomorrow
		repo.info.Date = date
		if _, err := uc.PrepareUpload(ctx, m, student, "student", dto.UploadTicketRequest{Name: "a.jpg", Size: 10}); !errors.Is(err, ErrNotToday) {
			t.Fatalf("%s: %v", date, err)
		}
		if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: "meetings/x/attendance/a.jpg"}); !errors.Is(err, ErrNotToday) {
			t.Fatalf("%s mark: %v", date, err)
		}
		mine, err := uc.Mine(ctx, m, student, "student")
		if err != nil || mine.CanMark {
			t.Fatalf("%s: can_mark must be false (%+v, %v)", date, mine, err)
		}
	}

	// the day is judged in the app timezone: 23:30 Jakarta on the 16th is still the 16th
	repo.info.Date = today
	loc := uc.loc
	uc.nowFunc = func() time.Time { return time.Date(2026, 11, 16, 23, 30, 0, 0, loc) }
	if mine, _ := uc.Mine(ctx, m, student, "student"); !mine.CanMark {
		t.Fatal("late in the evening of the meeting day must still allow it")
	}
}

func TestPhotoRules(t *testing.T) {
	uc, _, store, _, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()

	for _, bad := range []string{"selfie.gif", "selfie.pdf", "selfie.svg", "selfie", "selfie.exe"} {
		if _, err := uc.PrepareUpload(ctx, m, student, "student", dto.UploadTicketRequest{Name: bad, Size: 10}); !errors.Is(err, ErrBadRequest) {
			t.Fatalf("%s accepted: %v", bad, err)
		}
	}
	if _, err := uc.PrepareUpload(ctx, m, student, "student", dto.UploadTicketRequest{Name: "big.jpg", Size: dto.MaxPhotoBytes + 1}); !errors.Is(err, ErrBadRequest) {
		t.Fatalf("too big: %v", err)
	}
	for _, ok := range []string{"a.jpg", "A.JPEG", "b.png", "c.webp"} {
		if _, err := uc.PrepareUpload(ctx, m, student, "student", dto.UploadTicketRequest{Name: ok, Size: 1000}); err != nil {
			t.Fatalf("%s rejected: %v", ok, err)
		}
	}
	if store.postMax != dto.MaxPhotoBytes {
		t.Fatalf("storage must enforce the size limit, got %d", store.postMax)
	}
}

func TestMarkValidatesTheKey(t *testing.T) {
	uc, repo, store, _, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()
	prefix := "meetings/" + m + "/attendance/"

	bad := []string{
		"",
		"meetings/" + uuid.NewString() + "/attendance/a.jpg", // another meeting's folder
		"meetings/" + m + "/attachments/a.jpg",               // the attachments folder
		prefix + "../../" + uuid.NewString() + "/x.jpg",
		prefix + "a.pdf", // not a photo
	}
	for _, key := range bad {
		store.files[key] = 5
		if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: key}); !errors.Is(err, ErrBadRequest) {
			t.Fatalf("key %q accepted: %v", key, err)
		}
	}
	// a key that was never uploaded
	if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: prefix + "ghost.jpg"}); !errors.Is(err, ErrBadRequest) {
		t.Fatalf("not uploaded: %v", err)
	}
	// uploaded but larger than allowed (a forged ticket): refused and removed
	store.files[prefix+"huge.jpg"] = dto.MaxPhotoBytes + 1
	if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: prefix + "huge.jpg"}); !errors.Is(err, ErrBadRequest) {
		t.Fatalf("huge: %v", err)
	}
	if len(store.removed) != 1 || !strings.HasSuffix(store.removed[0], "huge.jpg") {
		t.Fatalf("oversized file must be removed, removed=%v", store.removed)
	}
	if len(repo.records) != 0 {
		t.Fatal("nothing may be saved for a bad key")
	}
}

func TestMarkAndReplace(t *testing.T) {
	uc, repo, store, _, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()

	// first check-in
	k1 := ticketAndUpload(t, uc, store, meeting, student, "first.jpg", 2000)
	got, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: k1})
	if err != nil || !got.Marked || got.MarkedAt == nil || !strings.HasSuffix(got.PhotoURL, k1) || !got.CanMark {
		t.Fatalf("first mark: %+v err=%v", got, err)
	}
	if len(repo.records) != 1 || len(store.removed) != 0 {
		t.Fatalf("records=%d removed=%v", len(repo.records), store.removed)
	}

	// a second photo replaces it, and the old file is removed from storage
	k2 := ticketAndUpload(t, uc, store, meeting, student, "second.png", 3000)
	got, err = uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: k2})
	if err != nil || !strings.HasSuffix(got.PhotoURL, k2) {
		t.Fatalf("second mark: %+v err=%v", got, err)
	}
	if len(repo.records) != 1 || repo.records[student].PhotoKey != k2 {
		t.Fatalf("must still be one record, pointing at the new photo: %+v", repo.records[student])
	}
	if len(store.removed) != 1 || store.removed[0] != k1 {
		t.Fatalf("old photo must be removed, removed=%v", store.removed)
	}

	// re-submitting the very same key must not delete the photo it points to
	if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: k2}); err != nil || len(store.removed) != 1 {
		t.Fatalf("same key again: err=%v removed=%v", err, store.removed)
	}
}

func TestRoster(t *testing.T) {
	uc, repo, _, tutor, _, meeting := setup()
	now := time.Now()
	repo.roster = []repository.RosterRow{
		{UserID: uuid.New(), Name: "Alya Putri", Username: "alya"},
		{UserID: uuid.New(), Name: "Rina Pratama", Username: "rina", HasRecord: true, PhotoKey: "meetings/m/attendance/r.jpg", MarkedAt: &now},
		{UserID: uuid.New(), Name: "Budi Santoso", Username: "budi", HasRecord: true, PhotoKey: "meetings/m/attendance/b.png", MarkedAt: &now},
	}
	got, err := uc.Roster(context.Background(), meeting.String(), tutor, "tutor")
	if err != nil {
		t.Fatal(err)
	}
	if got.Total != 3 || got.Present != 2 || len(got.Students) != 3 {
		t.Fatalf("counts wrong: %+v", got)
	}
	if got.Students[0].Present || got.Students[0].PhotoURL != "" {
		t.Fatalf("absent student must have no photo: %+v", got.Students[0])
	}
	if !got.Students[1].Present || !strings.HasSuffix(got.Students[1].PhotoURL, "r.jpg") {
		t.Fatalf("present student: %+v", got.Students[1])
	}
}

func TestStorageDownIsNotReportedAsNotUploaded(t *testing.T) {
	uc, repo, store, _, student, meeting := setup()
	ctx, m := context.Background(), meeting.String()
	key := ticketAndUpload(t, uc, store, meeting, student, "a.jpg", 1000)

	// storage cannot be checked: say so (and do not claim the photo is missing)
	store.statErr = errors.New("dial tcp: connection refused")
	_, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: key})
	if !errors.Is(err, ErrStorage) || errors.Is(err, ErrBadRequest) {
		t.Fatalf("storage down: %v", err)
	}
	if strings.Contains(err.Error(), "connection refused") {
		t.Fatalf("internal details must not reach the client: %v", err)
	}

	// the file really is missing: that is a bad request
	store.statErr = nil
	delete(store.files, key)
	if _, err := uc.Mark(ctx, m, student, "student", dto.MarkRequest{Key: key}); !errors.Is(err, ErrBadRequest) || !strings.Contains(err.Error(), "not uploaded") {
		t.Fatalf("missing file: %v", err)
	}
	if len(repo.records) != 0 {
		t.Fatal("nothing may be saved in either case")
	}
}
