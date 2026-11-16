package usecase

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/submission/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var (
	ErrMeetingNotFound    = errors.New("meeting not found")
	ErrSubmissionNotFound = errors.New("submission not found")
	ErrForbidden          = errors.New("only the owner can delete this submission")
	ErrGradeForbidden     = errors.New("only a tutor can grade submissions")
)

type submissionUsecase struct {
	repo repository.SubmissionRepository
}

func NewSubmissionUsecase(repo repository.SubmissionRepository) SubmissionUsecase {
	return &submissionUsecase{repo: repo}
}

func (u *submissionUsecase) existingMeeting(meetingID string) (uuid.UUID, error) {
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

func (u *submissionUsecase) FindByMeetingID(meetingID string, callerID uuid.UUID, role string, params pagination.Params) ([]dto.SubmissionResponse, pagination.Meta, error) {
	id, err := u.existingMeeting(meetingID)
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	var onlyUser *uuid.UUID
	if role == "student" {
		onlyUser = &callerID
	} else if role == "tutor" {
		// a tutor only sees submissions of their own tutorials
		if err := u.ensureTutorOwns(id, callerID); err != nil {
			return nil, pagination.Meta{}, err
		}
	}
	items, meta, err := u.repo.FindByMeetingID(id, onlyUser, params)
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	out := make([]dto.SubmissionResponse, len(items))
	for i, item := range items {
		out[i] = dto.ToSubmissionResponse(item)
	}
	return out, meta, nil
}

// ensureTutorOwns returns ErrMeetingNotFound unless the meeting belongs to a
// tutorial created by callerID (someone else's looks the same as a missing one).
func (u *submissionUsecase) ensureTutorOwns(meetingID, callerID uuid.UUID) error {
	creator, err := u.repo.TutorialCreatorOfMeeting(meetingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrMeetingNotFound
		}
		return err
	}
	if creator == nil || *creator != callerID {
		return ErrMeetingNotFound
	}
	return nil
}

func (u *submissionUsecase) Grade(id string, callerID uuid.UUID, role string, req dto.GradeSubmissionRequest) (*dto.SubmissionResponse, error) {
	if role != "tutor" && role != "admin" {
		return nil, ErrGradeForbidden
	}

	sid, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrSubmissionNotFound
	}
	submission, err := u.repo.FindByID(sid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSubmissionNotFound
		}
		return nil, err
	}

	if role == "tutor" {
		if err := u.ensureTutorOwns(submission.MeetingID, callerID); err != nil {
			return nil, ErrSubmissionNotFound
		}
	}

	now := time.Now()
	submission.Grade = req.Grade
	submission.Feedback = req.Feedback
	submission.GradedAt = &now
	if err := u.repo.Update(submission); err != nil {
		return nil, err
	}

	resp := dto.ToSubmissionResponse(*submission)
	return &resp, nil
}

func (u *submissionUsecase) Create(meetingID string, callerID uuid.UUID, req dto.CreateSubmissionRequest) (*dto.SubmissionResponse, error) {
	id, err := u.existingMeeting(meetingID)
	if err != nil {
		return nil, err
	}

	submission := &entity.Submission{
		MeetingID: id,
		UserID:    callerID,
		Answer:    req.Answer,
		Files:     req.Files,
	}
	if err := u.repo.Create(submission); err != nil {
		return nil, err
	}
	resp := dto.ToSubmissionResponse(*submission)
	return &resp, nil
}

func (u *submissionUsecase) Delete(id string, callerID uuid.UUID) error {
	sid, err := uuid.Parse(id)
	if err != nil {
		return ErrSubmissionNotFound
	}

	submission, err := u.repo.FindByID(sid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSubmissionNotFound
		}
		return err
	}

	if submission.UserID != callerID {
		return ErrForbidden
	}
	return u.repo.Delete(submission)
}
