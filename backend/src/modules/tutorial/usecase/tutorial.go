package usecase

import (
	"context"
	"gorm.io/gorm"
	"time"

	"crypto/rand"
	"errors"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"math/big"

	"github.com/google/uuid"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

// FileCleaner removes the stored files of meetings that were deleted.
type FileCleaner interface {
	RemoveMeetingFiles(ctx context.Context, meetingIDs []uuid.UUID)
}

type tutorialUsecase struct {
	repo  repository.TutorialRepository
	files FileCleaner
}

func NewTutorialUsecase(repo repository.TutorialRepository, files FileCleaner) TutorialUsecase {
	return &tutorialUsecase{repo: repo, files: files}
}

func (u *tutorialUsecase) FindAll(params pagination.Params, creatorID *uuid.UUID) ([]entity.Tutorial, pagination.Meta, error) {
	return u.repo.FindAll(params, creatorID)
}

// ErrStudentsOnly is returned when a non-student asks for "my enrolled tutorials".
var ErrStudentsOnly = errors.New("only students have enrolled tutorials")

func (u *tutorialUsecase) FindEnrolled(userID uuid.UUID, role string, done *bool, params pagination.Params) ([]dto.EnrolledTutorial, pagination.Meta, error) {
	if role != "student" {
		return nil, pagination.Meta{}, ErrStudentsOnly
	}
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return u.repo.FindEnrolled(userID, done, time.Now().In(loc).Format("2006-01-02"), params)
}

func (u *tutorialUsecase) FindEnrolledByID(userID uuid.UUID, role, tutorialID string) (*dto.EnrolledTutorial, error) {
	if role != "student" {
		return nil, ErrStudentsOnly
	}
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return nil, gorm.ErrRecordNotFound
	}
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return u.repo.FindEnrolledByID(userID, tid, time.Now().In(loc).Format("2006-01-02"))
}

func (u *tutorialUsecase) FindByID(id string) (*entity.Tutorial, error) {
	return u.repo.FindByID(id)
}

func (u *tutorialUsecase) Create(creatorID uuid.UUID, req dto.CreateTutorialRequest) (*entity.Tutorial, error) {
	tutorial := &entity.Tutorial{
		CreatedBy:      &creatorID,
		Name:           req.Name,
		DateStarted:    req.DateStarted.Time,
		DateEnded:      req.DateEnded.Time,
		MeetingDays:    req.MeetingDays,
		IsDone:         req.IsDone,
		Description:    req.Description,
		ShowDownload:   req.ShowDownload,
		ShowAttendance: req.ShowAttendance,
		ShowFeedback:   req.ShowFeedback,

		BundleIncludeRecordings: req.BundleIncludeRecordings != nil && *req.BundleIncludeRecordings,
		BundleIncludeHomework:   req.BundleIncludeHomework == nil || *req.BundleIncludeHomework,
	}

	customID, err := u.generateCustomID()
	if err != nil {
		return nil, err
	}
	tutorial.CustomID = customID

	if err := u.repo.Create(tutorial); err != nil {
		return nil, err
	}

	return tutorial, nil
}

func (u *tutorialUsecase) Update(id string, req dto.UpdateTutorialRequest) (*entity.Tutorial, error) {
	tutorial, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		tutorial.Name = *req.Name
	}
	if req.DateStarted != nil {
		tutorial.DateStarted = req.DateStarted.Time
	}
	if req.DateEnded != nil {
		tutorial.DateEnded = req.DateEnded.Time
	}
	if req.MeetingDays != nil {
		tutorial.MeetingDays = *req.MeetingDays
	}
	if req.IsDone != nil {
		tutorial.IsDone = *req.IsDone
	}
	if req.Description != nil {
		tutorial.Description = *req.Description
	}
	if req.ShowDownload != nil {
		tutorial.ShowDownload = *req.ShowDownload
	}
	if req.ShowAttendance != nil {
		tutorial.ShowAttendance = *req.ShowAttendance
	}
	if req.ShowFeedback != nil {
		tutorial.ShowFeedback = *req.ShowFeedback
	}
	if req.BundleIncludeRecordings != nil {
		tutorial.BundleIncludeRecordings = *req.BundleIncludeRecordings
	}
	if req.BundleIncludeHomework != nil {
		tutorial.BundleIncludeHomework = *req.BundleIncludeHomework
	}

	if err := u.repo.Update(tutorial); err != nil {
		return nil, err
	}

	return tutorial, nil
}

func (u *tutorialUsecase) Delete(id string) error {
	tutorial, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	// the database removes the meetings, submissions, attachments and enrollments with
	// the tutorial; the stored files need their ids first, then a sweep once it is gone
	meetingIDs, err := u.repo.MeetingIDs(tutorial.ID)
	if err != nil {
		return err
	}
	if err := u.repo.Delete(tutorial); err != nil {
		return err
	}
	u.files.RemoveMeetingFiles(context.Background(), meetingIDs)
	return nil
}

const (
	customIDLength   = 6
	customIDCharset  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	customIDAttempts = 10
)

// generateCustomID returns a random, currently unused 6-char code.
func (u *tutorialUsecase) generateCustomID() (string, error) {
	max := big.NewInt(int64(len(customIDCharset)))
	for i := 0; i < customIDAttempts; i++ {
		b := make([]byte, customIDLength)
		for j := range b {
			n, err := rand.Int(rand.Reader, max)
			if err != nil {
				return "", err
			}
			b[j] = customIDCharset[n.Int64()]
		}
		id := string(b)

		exists, err := u.repo.ExistsByCustomID(id)
		if err != nil {
			return "", err
		}
		if !exists {
			return id, nil
		}
	}
	return "", errors.New("failed to generate unique custom id")
}
