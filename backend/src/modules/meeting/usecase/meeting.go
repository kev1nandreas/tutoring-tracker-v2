package usecase

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type meetingUsecase struct {
	repo repository.MeetingRepository
}

func NewMeetingUsecase(repo repository.MeetingRepository) MeetingUsecase {
	return &meetingUsecase{repo: repo}
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

func (u *meetingUsecase) Create(req dto.CreateMeetingRequest) (*entity.Meeting, error) {
	meeting := &entity.Meeting{
		TutorialID:   req.TutorialID,
		Title:        req.Title,
		Date:         req.Date,
		YoutubeLink:  req.YoutubeLink,
		TimeStart:    req.TimeStart,
		TimeEnd:      req.TimeEnd,
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

	if req.TutorialID != nil {
		meeting.TutorialID = *req.TutorialID
	}
	if req.Title != nil {
		meeting.Title = *req.Title
	}
	if req.Date != nil {
		meeting.Date = *req.Date
	}
	if req.YoutubeLink != nil {
		meeting.YoutubeLink = *req.YoutubeLink
	}
	if req.TimeStart != nil {
		meeting.TimeStart = *req.TimeStart
	}
	if req.TimeEnd != nil {
		meeting.TimeEnd = *req.TimeEnd
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
