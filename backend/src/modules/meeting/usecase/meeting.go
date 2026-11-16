package usecase

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/datetime"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type meetingUsecase struct {
	repo repository.MeetingRepository
	loc  *time.Location
}

func NewMeetingUsecase(repo repository.MeetingRepository) MeetingUsecase {
	loc, err := time.LoadLocation(config.GetEnvString("APP_TIMEZONE", "Asia/Jakarta"))
	if err != nil {
		loc = time.UTC
	}
	return &meetingUsecase{repo: repo, loc: loc}
}

func (u *meetingUsecase) FindAll(params pagination.Params) ([]entity.Meeting, pagination.Meta, error) {
	return u.repo.FindAll(params)
}

func (u *meetingUsecase) FindByTutorialID(tutorialID string, params pagination.Params) ([]entity.Meeting, pagination.Meta, error) {
	return u.repo.FindByTutorialID(tutorialID, params)
}

func (u *meetingUsecase) FindByID(id string) (*entity.Meeting, error) {
	return u.repo.FindByID(id)
}

// ErrInvalidTimeRange is returned when a meeting does not end after it starts.
var ErrInvalidTimeRange = errors.New("end time must be after the start time")

func (u *meetingUsecase) TutorialCreator(tutorialID string) (*uuid.UUID, error) {
	return u.repo.TutorialCreator(tutorialID)
}

func (u *meetingUsecase) Create(req dto.CreateMeetingRequest) (*entity.Meeting, error) {
	if req.TimeEnd.Minutes() <= req.TimeStart.Minutes() {
		return nil, ErrInvalidTimeRange
	}

	meeting := &entity.Meeting{
		TutorialID:   req.TutorialID,
		Title:        req.Title,
		Date:         req.Date.Time,
		YoutubeLink:  req.YoutubeLink,
		TimeStart:    req.TimeStart.On(req.Date.Time, u.loc),
		TimeEnd:      req.TimeEnd.On(req.Date.Time, u.loc),
		IsDone:       req.IsDone,
		Marks:        req.Marks,
		HasHomework:  req.HasHomework,
		TextHomework: req.TextHomework,
	}

	if err := u.repo.Create(meeting); err != nil {
		return nil, err
	}

	return meeting, nil
}

func (u *meetingUsecase) Update(id string, req dto.UpdateMeetingRequest) (*entity.Meeting, error) {
	meeting, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		meeting.Title = *req.Title
	}
	if req.YoutubeLink != nil {
		meeting.YoutubeLink = *req.YoutubeLink
	}
	if req.IsDone != nil {
		meeting.IsDone = *req.IsDone
	}
	if req.Marks != nil {
		meeting.Marks = *req.Marks
	}
	if req.HasHomework != nil {
		meeting.HasHomework = *req.HasHomework
	}
	if req.TextHomework != nil {
		meeting.TextHomework = *req.TextHomework
	}

	// date and times are stored together: rebuild all three from the final values
	if req.Date != nil || req.TimeStart != nil || req.TimeEnd != nil {
		date := meeting.Date
		if req.Date != nil {
			date = req.Date.Time
		}
		start := datetime.ClockOf(meeting.TimeStart, u.loc)
		if req.TimeStart != nil {
			start = *req.TimeStart
		}
		end := datetime.ClockOf(meeting.TimeEnd, u.loc)
		if req.TimeEnd != nil {
			end = *req.TimeEnd
		}
		if end.Minutes() <= start.Minutes() {
			return nil, ErrInvalidTimeRange
		}

		meeting.Date = date
		meeting.TimeStart = start.On(date, u.loc)
		meeting.TimeEnd = end.On(date, u.loc)
	}

	if err := u.repo.Update(meeting); err != nil {
		return nil, err
	}

	return meeting, nil
}

func (u *meetingUsecase) Delete(id string) error {
	meeting, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}

	return u.repo.Delete(meeting)
}
