package usecase

import (
	"context"
	"errors"
	"fmt"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/objstore"
	"io"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/repository"
	"gorm.io/gorm"
)

// QueueBundle holds "prepare this download" jobs.
const QueueBundle = "bundle.prepare"

// TypeDownload is the notification type used when a package is ready (or failed).
const TypeDownload = "download"

const downloadPath = "/api/v1/bundles/%s/download?token=%s"

var (
	ErrForbidden    = errors.New("only students can download a class package")
	ErrNotFound     = errors.New("tutorial or download not found")
	ErrDownloadsOff = errors.New("your tutor has not turned on downloads for this class")
	ErrNotReady     = errors.New("this download is not ready, or it has expired; request it again")
	ErrQueueDown    = errors.New("downloads are unavailable right now, please try again in a moment")
)

// ObjectStore reads stored files.
type ObjectStore interface {
	GetObject(ctx context.Context, key string) (io.ReadCloser, error)
	// StatSize returns the stored size of a file, or an error if it is not there.
	StatSize(ctx context.Context, key string) (int64, error)
}

// Publisher puts a JSON message on a queue (implemented by factory.RabbitMQ).
type Publisher interface {
	PublishJSON(ctx context.Context, queue string, v any) error
}

// Sender delivers one notification to many users (implemented by the notification usecase).
type Sender interface {
	NotifyUsers(userIDs []uuid.UUID, notificationType, header, body string) error
}

type job struct {
	RequestID uuid.UUID `json:"request_id"`
}

type bundleUsecase struct {
	repo      repository.BundleRepository
	store     ObjectStore
	publisher Publisher
	sender    Sender
	loc       *time.Location

	pubMu    sync.Mutex // an AMQP channel must not publish concurrently
	maxBytes int64
	readyFor time.Duration
	nowFunc  func() time.Time // replaced in tests
}

func NewBundleUsecase(repo repository.BundleRepository, store ObjectStore, publisher Publisher, sender Sender) BundleUsecase {
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return &bundleUsecase{
		repo: repo, store: store, publisher: publisher, sender: sender, loc: loc,
		maxBytes: int64(config.GetEnvInt("BUNDLE_MAX_MB", 2048)) << 20,
		readyFor: time.Duration(config.GetEnvInt("BUNDLE_READY_MINUTES", 60)) * time.Minute,
		nowFunc:  time.Now,
	}
}

func (u *bundleUsecase) respond(r *entity.Request) *dto.RequestResponse {
	now := u.nowFunc()
	resp := &dto.RequestResponse{
		ID: r.ID.String(), Status: r.Status, FileCount: r.FileCount, TotalBytes: r.TotalBytes,
		Error: r.Error, ExpiresAt: r.ExpiresAt,
	}
	if r.Status == entity.StatusReady {
		if r.ExpiresAt != nil && !r.ExpiresAt.After(now) {
			resp.Status = "expired"
		} else {
			resp.DownloadURL = fmt.Sprintf(downloadPath, r.ID, issueToken(r.ID, r.UserID, now))
		}
	}
	return resp
}

func (u *bundleUsecase) Request(ctx context.Context, userID uuid.UUID, role, tutorialID string) (*dto.RequestResponse, bool, error) {
	if role != "student" {
		return nil, false, ErrForbidden
	}
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return nil, false, ErrNotFound
	}

	access, err := u.repo.Access(tid, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, ErrNotFound
		}
		return nil, false, err
	}
	if !access.Accepted {
		return nil, false, ErrNotFound // someone else's class looks like a missing one
	}
	if !access.ShowDownload {
		return nil, false, ErrDownloadsOff
	}

	// one unfinished (or still valid) request at a time per class
	if existing, err := u.repo.FindActive(tid, userID, u.nowFunc()); err == nil {
		return u.respond(existing), false, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	req := &entity.Request{
		TutorialID: tid, UserID: userID, Status: entity.StatusQueued,
		IncludeRecordings: access.IncludeRecordings, IncludeHomework: access.IncludeHomework,
	}
	if err := u.repo.Create(req); err != nil {
		return nil, false, err
	}

	u.pubMu.Lock()
	pubErr := u.publisher.PublishJSON(ctx, QueueBundle, job{RequestID: req.ID})
	u.pubMu.Unlock()
	if pubErr != nil {
		log.Printf("bundle: could not enqueue request %s: %v", req.ID, pubErr)
		req.Status, req.Error = entity.StatusFailed, "Could not start the download."
		_ = u.repo.Save(req)
		return nil, false, ErrQueueDown
	}

	return u.respond(req), true, nil
}

func (u *bundleUsecase) Status(userID uuid.UUID, requestID string) (*dto.RequestResponse, error) {
	id, err := uuid.Parse(requestID)
	if err != nil {
		return nil, ErrNotFound
	}
	req, err := u.repo.FindByID(id)
	if err != nil || req.UserID != userID { // someone else's request looks like a missing one
		if err == nil || errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return u.respond(req), nil
}

// Prepare checks that the package can be built and marks the request ready. It does not
// build the zip: that happens, streamed, when the student downloads it. The job exists
// so a heavy class never blocks a web request, and so the student is told when it is OK.
func (u *bundleUsecase) Prepare(ctx context.Context, requestID uuid.UUID) error {
	req, err := u.repo.FindByID(requestID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // deleted meanwhile (for example with its tutorial): nothing to do
		}
		return err
	}
	// a redelivered job may find it already preparing; anything else is done or failed
	if req.Status != entity.StatusQueued && req.Status != entity.StatusPreparing {
		return nil
	}

	req.Status = entity.StatusPreparing
	if err := u.repo.Save(req); err != nil {
		return err
	}

	plan, err := u.repo.Plan(req.TutorialID, req.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}

	var files int
	var total int64
	for _, m := range plan.Meetings {
		for _, f := range m.Files {
			files++
			total += f.Size
		}
	}

	if total > u.maxBytes {
		u.fail(req, plan.TutorialName, fmt.Sprintf("This class has %s of files, more than the %s limit for one download. Ask your tutor to share them another way.", humanBytes(total), humanBytes(u.maxBytes)))
		return nil
	}

	now := u.nowFunc()
	expires := now.Add(u.readyFor)
	req.Status, req.FileCount, req.TotalBytes, req.Error = entity.StatusReady, files, total, ""
	req.ReadyAt, req.ExpiresAt = &now, &expires
	if err := u.repo.Save(req); err != nil {
		return err
	}

	u.notify(req.UserID, "Your download is ready",
		fmt.Sprintf("The package for \"%s\" is ready (%d files, %s). Open the class page to download it; it stays available for %d minutes.",
			plan.TutorialName, files, humanBytes(total), int(u.readyFor.Minutes())))
	return nil
}

func (u *bundleUsecase) Fail(ctx context.Context, requestID uuid.UUID, reason string) {
	req, err := u.repo.FindByID(requestID)
	if err != nil || req.Status == entity.StatusReady || req.Status == entity.StatusFailed {
		return
	}
	name := "your class"
	if access, err := u.repo.Access(req.TutorialID, req.UserID); err == nil {
		name = "\"" + access.TutorialName + "\""
	}
	u.fail(req, name, reason)
}

func (u *bundleUsecase) fail(req *entity.Request, name, reason string) {
	if len(reason) > 250 {
		reason = reason[:250]
	}
	req.Status, req.Error = entity.StatusFailed, reason
	if err := u.repo.Save(req); err != nil {
		log.Printf("bundle: could not mark request %s failed: %v", req.ID, err)
	}
	u.notify(req.UserID, "Download failed", fmt.Sprintf("Your download of %s could not be prepared. %s", name, reason))
}

func (u *bundleUsecase) notify(userID uuid.UUID, header, body string) {
	if err := u.sender.NotifyUsers([]uuid.UUID{userID}, TypeDownload, header, body); err != nil {
		log.Printf("bundle: notification to %s failed: %v", userID, err)
	}
}

func (u *bundleUsecase) Authorize(token string) (uuid.UUID, uuid.UUID, error) {
	return parseToken(token, u.nowFunc())
}

func (u *bundleUsecase) Open(requestID, userID uuid.UUID) (*Package, error) {
	req, err := u.repo.FindByID(requestID)
	if err != nil || req.UserID != userID {
		return nil, ErrNotReady
	}
	if req.Status != entity.StatusReady || req.ExpiresAt == nil || !req.ExpiresAt.After(u.nowFunc()) {
		return nil, ErrNotReady
	}

	// the situation may have changed since the request
	access, err := u.repo.Access(req.TutorialID, userID)
	if err != nil || !access.Accepted {
		return nil, ErrNotFound
	}
	if !access.ShowDownload {
		return nil, ErrDownloadsOff
	}

	plan, err := u.repo.Plan(req.TutorialID, userID)
	if err != nil {
		return nil, err
	}
	u.settleFiles(context.Background(), plan)
	opt := summaryOptions{Recordings: req.IncludeRecordings, Homework: req.IncludeHomework, Now: u.nowFunc().In(u.loc)}

	return &Package{
		FileName: safeName(plan.TutorialName) + " - materials.zip",
		Write: func(ctx context.Context, w io.Writer) error {
			return u.writeZip(ctx, w, plan, opt)
		},
	}, nil
}

// settleFiles makes the plan describe exactly what the zip will hold: files missing from
// storage are dropped (they could not be copied anyway), and every remaining file gets its
// final, cleaned and unique name inside its meeting folder.
func (u *bundleUsecase) settleFiles(ctx context.Context, plan *repository.Plan) {
	for i := range plan.Meetings {
		used := map[string]bool{}
		kept := plan.Meetings[i].Files[:0]
		for _, f := range plan.Meetings[i].Files {
			size, err := u.store.StatSize(ctx, f.Key)
			switch {
			case errors.Is(err, objstore.ErrNotFound):
				log.Printf("bundle: leaving out %q (%s): not in storage", f.Name, f.Key)
				continue
			case err != nil:
				// cannot tell: keep the file, copying it will skip it if it really is missing
				log.Printf("bundle: could not check %q (%s): %v", f.Name, f.Key, err)
			default:
				f.Size = size
			}
			f.ZipName = uniqueName(safeName(f.Name), used)
			kept = append(kept, f)
		}
		plan.Meetings[i].Files = kept
	}
}
