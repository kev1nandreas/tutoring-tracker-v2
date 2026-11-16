package usecase

import (
	"crypto/rand"
	"errors"
	"math/big"

	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type tutorialUsecase struct {
	repo repository.TutorialRepository
}

func NewTutorialUsecase(repo repository.TutorialRepository) TutorialUsecase {
	return &tutorialUsecase{repo: repo}
}

func (u *tutorialUsecase) FindAll(params pagination.Params) ([]entity.Tutorial, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *tutorialUsecase) FindByID(id string) (*entity.Tutorial, error) {
	return u.repo.FindByID(id)
}

func (u *tutorialUsecase) Create(req dto.CreateTutorialRequest) (*entity.Tutorial, error) {
	tutorial := &entity.Tutorial{
		Name:           req.Name,
		DateStarted:    req.DateStarted.Time,
		DateEnded:      req.DateEnded.Time,
		MeetingDays:    req.MeetingDays,
		IsDone:         req.IsDone,
		Description:    req.Description,
		ShowDownload:   req.ShowDownload,
		ShowAttendance: req.ShowAttendance,
		ShowFeedback:   req.ShowFeedback,
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

	return u.repo.Delete(tutorial)
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
