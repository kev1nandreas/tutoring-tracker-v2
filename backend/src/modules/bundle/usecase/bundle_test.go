package usecase

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/objstore"
	"io"
	"os"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/repository"
	"gorm.io/gorm"
)

// ---- in-memory fakes ----

type fakeRepo struct {
	access   repository.Access
	missing  bool
	requests map[uuid.UUID]*entity.Request
	plan     repository.Plan
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		requests: map[uuid.UUID]*entity.Request{},
		access:   repository.Access{TutorialName: "Algebra: Grade 10/11", Accepted: true, ShowDownload: true, IncludeHomework: true},
	}
}

func (f *fakeRepo) Access(_, _ uuid.UUID) (*repository.Access, error) {
	if f.missing {
		return nil, gorm.ErrRecordNotFound
	}
	a := f.access
	return &a, nil
}

func (f *fakeRepo) FindActive(tutorialID, userID uuid.UUID, now time.Time) (*entity.Request, error) {
	var best *entity.Request
	for _, r := range f.requests {
		if r.TutorialID != tutorialID || r.UserID != userID {
			continue
		}
		active := r.Status == entity.StatusQueued || r.Status == entity.StatusPreparing ||
			(r.Status == entity.StatusReady && r.ExpiresAt != nil && r.ExpiresAt.After(now))
		if active && (best == nil || r.CreatedAt.After(best.CreatedAt)) {
			best = r
		}
	}
	if best == nil {
		return nil, gorm.ErrRecordNotFound
	}
	return best, nil
}

func (f *fakeRepo) FindByID(id uuid.UUID) (*entity.Request, error) {
	if r, ok := f.requests[id]; ok {
		c := *r
		return &c, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (f *fakeRepo) Create(r *entity.Request) error {
	r.ID, r.CreatedAt = uuid.New(), time.Now()
	c := *r
	f.requests[r.ID] = &c
	return nil
}

func (f *fakeRepo) Save(r *entity.Request) error {
	c := *r
	f.requests[r.ID] = &c
	return nil
}

func (f *fakeRepo) Plan(_, _ uuid.UUID) (*repository.Plan, error) {
	p := f.plan
	return &p, nil
}

type fakeStore struct {
	files map[string]string
	reads []string
}

func (s *fakeStore) GetObject(_ context.Context, key string) (io.ReadCloser, error) {
	s.reads = append(s.reads, key)
	body, ok := s.files[key]
	if !ok {
		return nil, errors.New("no such key")
	}
	return io.NopCloser(strings.NewReader(body)), nil
}

func (s *fakeStore) StatSize(_ context.Context, key string) (int64, error) {
	body, ok := s.files[key]
	if !ok {
		return 0, objstore.ErrNotFound
	}
	return int64(len(body)), nil
}

type fakePublisher struct {
	jobs []job
	err  error
}

func (p *fakePublisher) PublishJSON(_ context.Context, queue string, v any) error {
	if p.err != nil {
		return p.err
	}
	if queue != QueueBundle {
		return errors.New("wrong queue " + queue)
	}
	p.jobs = append(p.jobs, v.(job))
	return nil
}

type note struct{ header, body string }
type fakeSender struct{ notes []note }

func (s *fakeSender) NotifyUsers(_ []uuid.UUID, typ, header, body string) error {
	if typ != TypeDownload {
		return errors.New("wrong type")
	}
	s.notes = append(s.notes, note{header, body})
	return nil
}

func setup() (*bundleUsecase, *fakeRepo, *fakeStore, *fakePublisher, *fakeSender) {
	repo, store, pub, sender := newFakeRepo(), &fakeStore{files: map[string]string{}}, &fakePublisher{}, &fakeSender{}
	uc := NewBundleUsecase(repo, store, pub, sender).(*bundleUsecase)
	return uc, repo, store, pub, sender
}

// ---- tests ----

func TestRequestRules(t *testing.T) {
	uc, repo, _, pub, _ := setup()
	user, tut := uuid.New(), uuid.New()
	ctx := context.Background()

	if _, _, err := uc.Request(ctx, user, "tutor", tut.String()); !errors.Is(err, ErrForbidden) {
		t.Fatalf("tutor: got %v", err)
	}
	if _, _, err := uc.Request(ctx, user, "student", "not-a-uuid"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bad id: got %v", err)
	}
	repo.missing = true
	if _, _, err := uc.Request(ctx, user, "student", tut.String()); !errors.Is(err, ErrNotFound) {
		t.Fatalf("missing tutorial: got %v", err)
	}
	repo.missing = false

	repo.access.Accepted = false
	if _, _, err := uc.Request(ctx, user, "student", tut.String()); !errors.Is(err, ErrNotFound) {
		t.Fatalf("not accepted: got %v", err)
	}
	repo.access.Accepted = true

	repo.access.ShowDownload = false
	if _, _, err := uc.Request(ctx, user, "student", tut.String()); !errors.Is(err, ErrDownloadsOff) {
		t.Fatalf("downloads off: got %v", err)
	}
	repo.access.ShowDownload = true
	if len(pub.jobs) != 0 || len(repo.requests) != 0 {
		t.Fatal("rejected requests must not create anything")
	}

	// good request: queued, one job on the queue
	resp, created, err := uc.Request(ctx, user, "student", tut.String())
	if err != nil || !created || resp.Status != "queued" || len(pub.jobs) != 1 {
		t.Fatalf("good request: %+v created=%v err=%v jobs=%d", resp, created, err, len(pub.jobs))
	}
	if resp.DownloadURL != "" {
		t.Fatal("no link before it is ready")
	}

	// asking again while it is unfinished returns the same one, no second job
	again, created, err := uc.Request(ctx, user, "student", tut.String())
	if err != nil || created || again.ID != resp.ID || len(pub.jobs) != 1 {
		t.Fatalf("dedupe: %+v created=%v err=%v jobs=%d", again, created, err, len(pub.jobs))
	}

	// someone else cannot read it
	if _, err := uc.Status(uuid.New(), resp.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("other user status: %v", err)
	}
}

func TestQueueDown(t *testing.T) {
	uc, repo, _, pub, _ := setup()
	pub.err = errors.New("rabbit is down")
	_, _, err := uc.Request(context.Background(), uuid.New(), "student", uuid.New().String())
	if !errors.Is(err, ErrQueueDown) {
		t.Fatalf("got %v", err)
	}
	for _, r := range repo.requests {
		if r.Status != entity.StatusFailed {
			t.Fatalf("request must be marked failed, is %s", r.Status)
		}
	}
}

func demoPlan() repository.Plan {
	return repository.Plan{
		TutorialName: "Algebra: Grade 10/11", Code: "AB12CD", Description: "Equations and graphs.", TutorName: "Kevin Andreas",
		DateStarted: "2026-10-26", DateEnded: "2027-01-15", StudentName: "Rina Pratama", StudentSchool: "SMA 1 Jakarta",
		Meetings: []repository.Meeting{
			{Title: "Linear equations", Date: "2026-11-02", TimeStart: "16:00", TimeEnd: "17:30", IsDone: true,
				HasHomework: true, Homework: "Solve exercises 1-10.", YoutubeLink: "https://youtu.be/dQw4w9WgXcQ",
				Submission: &repository.Submission{SubmittedAt: time.Date(2026, 11, 3, 9, 0, 0, 0, time.UTC), Answer: "Done, #7 was tricky", Grade: intp(88), Feedback: "Check the sign in 7."},
				Files: []repository.File{
					{Name: "slides.pptx", Type: "ppt", Key: "meetings/m1/aaa.pptx", Size: 9},
					{Name: "slides.pptx", Type: "ppt", Key: "meetings/m1/bbb.pptx", Size: 7}, // same name twice
					{Name: "../../evil/name?.pdf", Type: "book", Key: "meetings/m1/ccc.pdf", Size: 5},
				}},
			{Title: "Quadratics / factoring", Date: "2026-11-09", TimeStart: "16:00", TimeEnd: "17:30", IsDone: false, HasHomework: true, Homework: "Bring your workbook."},
			{Title: "Recap", Date: "2026-11-16", Files: []repository.File{{Name: "gone.png", Type: "picture", Key: "meetings/m3/missing.png", Size: 3}}},
		},
	}
}

func intp(n int) *int { return &n }

// makeReady puts the usecase in the state "request exists, job already ran".
func makeReady(t *testing.T, uc *bundleUsecase, repo *fakeRepo, store *fakeStore, rec, hw bool) (reqID, userID uuid.UUID) {
	t.Helper()
	repo.plan = demoPlan()
	repo.access.IncludeRecordings, repo.access.IncludeHomework = rec, hw
	store.files = map[string]string{
		"meetings/m1/aaa.pptx": "AAAAAAAAA", "meetings/m1/bbb.pptx": "BBBBBBB", "meetings/m1/ccc.pdf": "CCCCC",
		// meetings/m3/missing.png is deliberately absent
	}
	user := uuid.New()
	resp, _, err := uc.Request(context.Background(), user, "student", uuid.New().String())
	if err != nil {
		t.Fatal(err)
	}
	id := uuid.MustParse(resp.ID)
	if err := uc.Prepare(context.Background(), id); err != nil {
		t.Fatal(err)
	}
	return id, user
}

func TestPrepareAndNotify(t *testing.T) {
	uc, repo, store, _, sender := setup()
	id, _ := makeReady(t, uc, repo, store, false, true)

	r := repo.requests[id]
	if r.Status != entity.StatusReady || r.FileCount != 4 || r.TotalBytes != 24 || r.ExpiresAt == nil {
		t.Fatalf("ready state wrong: %+v", r)
	}
	if len(sender.notes) != 1 || sender.notes[0].header != "Your download is ready" {
		t.Fatalf("notification wrong: %+v", sender.notes)
	}
	if len(store.reads) != 0 {
		t.Fatalf("Prepare must not read any file, read %v", store.reads)
	}

	// running the job again (a redelivery) must not notify twice
	if err := uc.Prepare(context.Background(), id); err != nil || len(sender.notes) != 1 {
		t.Fatalf("second Prepare: err=%v notes=%d", err, len(sender.notes))
	}

	// the status now carries a download link
	st, err := uc.Status(repo.requests[id].UserID, id.String())
	if err != nil || st.Status != "ready" || !strings.HasPrefix(st.DownloadURL, "/api/v1/bundles/"+id.String()+"/download?token=") {
		t.Fatalf("status: %+v err=%v", st, err)
	}
}

func TestTooLarge(t *testing.T) {
	uc, repo, store, _, sender := setup()
	uc.maxBytes = 10 // the demo class holds 24 bytes
	repo.plan = demoPlan()
	resp, _, _ := uc.Request(context.Background(), uuid.New(), "student", uuid.New().String())
	if err := uc.Prepare(context.Background(), uuid.MustParse(resp.ID)); err != nil {
		t.Fatal(err)
	}
	r := repo.requests[uuid.MustParse(resp.ID)]
	if r.Status != entity.StatusFailed || !strings.Contains(r.Error, "limit") {
		t.Fatalf("got %+v", r)
	}
	if len(sender.notes) != 1 || sender.notes[0].header != "Download failed" || len(store.reads) != 0 {
		t.Fatalf("notes=%+v reads=%v", sender.notes, store.reads)
	}
}

func TestExpiry(t *testing.T) {
	uc, repo, store, _, _ := setup()
	id, user := makeReady(t, uc, repo, store, false, true)

	uc.nowFunc = func() time.Time { return time.Now().Add(2 * time.Hour) }
	st, _ := uc.Status(user, id.String())
	if st.Status != "expired" || st.DownloadURL != "" {
		t.Fatalf("after expiry: %+v", st)
	}
	if _, err := uc.Open(id, user); !errors.Is(err, ErrNotReady) {
		t.Fatalf("Open after expiry: %v", err)
	}
	// an expired request no longer blocks a new one
	if _, created, err := uc.Request(context.Background(), user, "student", repo.requests[id].TutorialID.String()); err != nil || !created {
		t.Fatalf("new request after expiry: created=%v err=%v", created, err)
	}
}

func TestToken(t *testing.T) {
	rid, uid, now := uuid.New(), uuid.New(), time.Now()
	tok := issueToken(rid, uid, now)

	if r, u, err := parseToken(tok, now.Add(time.Minute)); err != nil || r != rid || u != uid {
		t.Fatalf("valid token: %v %v %v", r, u, err)
	}
	if _, _, err := parseToken(tok, now.Add(11*time.Minute)); !errors.Is(err, ErrBadToken) {
		t.Fatal("expired token accepted")
	}
	for name, bad := range map[string]string{
		"empty": "", "no dot": "abc", "garbage": "!!!.???",
		"tampered sig":     tok[:len(tok)-2] + "xx",
		"tampered payload": "AAAA" + tok[4:],
	} {
		if _, _, err := parseToken(bad, now); !errors.Is(err, ErrBadToken) {
			t.Fatalf("%s accepted", name)
		}
	}
}

func readZip(t *testing.T, pkg *Package) map[string]string {
	t.Helper()
	var buf bytes.Buffer
	if err := pkg.Write(context.Background(), &buf); err != nil {
		t.Fatal(err)
	}
	zr, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatalf("not a valid zip: %v", err)
	}
	out := map[string]string{}
	for _, f := range zr.File {
		rc, _ := f.Open()
		b, _ := io.ReadAll(rc)
		rc.Close()
		out[f.Name] = string(b)
	}
	return out
}

func TestZipLayout(t *testing.T) {
	uc, repo, store, _, _ := setup()
	id, user := makeReady(t, uc, repo, store, true, true)

	pkg, err := uc.Open(id, user)
	if err != nil {
		t.Fatal(err)
	}
	if pkg.FileName != "Algebra_ Grade 10_11 - materials.zip" {
		t.Fatalf("file name %q", pkg.FileName)
	}
	files := readZip(t, pkg)

	names := make([]string, 0, len(files))
	for n := range files {
		names = append(names, n)
	}
	sort.Strings(names)
	want := []string{
		"01 - Linear equations/_._evil_name_.pdf",
		"01 - Linear equations/slides (2).pptx",
		"01 - Linear equations/slides.pptx",
		"Summary - Algebra_ Grade 10_11.pdf",
	}
	if strings.Join(names, "\n") != strings.Join(want, "\n") {
		t.Fatalf("layout:\n got  %q\n want %q", names, want)
	}
	if files["01 - Linear equations/slides.pptx"] != "AAAAAAAAA" || files["01 - Linear equations/slides (2).pptx"] != "BBBBBBB" {
		t.Fatal("file contents wrong")
	}
	if !strings.HasPrefix(files["Summary - Algebra_ Grade 10_11.pdf"], "%PDF-") {
		t.Fatal("summary is not a PDF")
	}
	for n := range files {
		if strings.Contains(n, "Recap") || strings.Contains(n, "gone") {
			t.Fatalf("a missing file must not appear: %q", n)
		}
	}
	// no entry may escape its folder
	for n := range files {
		if strings.Contains(n, "..") || strings.HasPrefix(n, "/") {
			t.Fatalf("unsafe entry %q", n)
		}
	}

	// keep the zips for a text check of the PDF outside Go
	if dir := os.Getenv("BUNDLE_TEST_OUT"); dir != "" {
		for label, opts := range map[string][2]bool{"both": {true, true}, "none": {false, false}, "homework-only": {false, true}, "recording-only": {true, false}} {
			id, user := makeReady(t, uc, repo, store, opts[0], opts[1])
			pkg, _ := uc.Open(id, user)
			var buf bytes.Buffer
			_ = pkg.Write(context.Background(), &buf)
			_ = os.WriteFile(dir+"/"+label+".zip", buf.Bytes(), 0o644)
		}
	}
}

func TestOpenRechecks(t *testing.T) {
	uc, repo, store, _, _ := setup()
	id, user := makeReady(t, uc, repo, store, false, true)

	if _, err := uc.Open(id, uuid.New()); !errors.Is(err, ErrNotReady) {
		t.Fatalf("other user: %v", err)
	}
	repo.access.ShowDownload = false // the tutor turned downloads off after the request
	if _, err := uc.Open(id, user); !errors.Is(err, ErrDownloadsOff) {
		t.Fatalf("downloads turned off: %v", err)
	}
	repo.access.ShowDownload, repo.access.Accepted = true, false // the student was removed
	if _, err := uc.Open(id, user); !errors.Is(err, ErrNotFound) {
		t.Fatalf("no longer accepted: %v", err)
	}
}

func TestCancelledStopsStreaming(t *testing.T) {
	uc, repo, store, _, _ := setup()
	id, user := makeReady(t, uc, repo, store, false, true)
	pkg, _ := uc.Open(id, user)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // the browser went away
	if err := pkg.Write(ctx, io.Discard); err == nil {
		t.Fatal("a cancelled download must stop with an error")
	}
}

func TestSafeName(t *testing.T) {
	cases := map[string]string{
		"a/b\\c":                 "a_b_c",
		"  ..hidden.  ":          "hidden",
		"":                       "file",
		"???":                    "___",
		"tab\there\x00":          "tabhere",
		strings.Repeat("é", 200): strings.Repeat("é", 80),
		"Quadratics / factoring": "Quadratics _ factoring",
	}
	for in, want := range cases {
		if got := safeName(in); got != want {
			t.Errorf("safeName(%q) = %q, want %q", in, got, want)
		}
	}
}
