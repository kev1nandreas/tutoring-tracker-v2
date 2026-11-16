package usecase

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/auth"
	"gorm.io/gorm"
)

var (
	ErrNotFound         = errors.New("tutorial not found")
	ErrEmptyAnswer      = errors.New("every question must be answered")
	ErrClosed           = errors.New("feedback is not open for this tutorial")
	ErrAlreadySubmitted = errors.New("this email already sent feedback for this tutorial")
	ErrForbidden        = errors.New("only a tutor of this tutorial can read its feedback")
)

type FeedbackUsecase interface {
	Info(code string) (*dto.FormInfo, error)
	Submit(code string, req dto.SubmitRequest) error
	// Status: whether a student must send feedback before opening the tutorial.
	Status(tutorialID string, userID uuid.UUID, role string) (*dto.Status, error)
	Summary(tutorialID string, callerID uuid.UUID, role string) (*dto.Summary, error)
}

type feedbackUsecase struct {
	repo repository.FeedbackRepository
	salt []byte
}

func NewFeedbackUsecase(repo repository.FeedbackRepository) FeedbackUsecase {
	salt := []byte(config.GetEnvString("FEEDBACK_SALT", ""))
	if len(salt) == 0 {
		salt = auth.JwtKey
	}
	return &feedbackUsecase{repo: repo, salt: salt}
}

// hash is the anonymous identity: stable per tutorial and email, impossible to turn back into the email.
func (u *feedbackUsecase) hash(tutorialID uuid.UUID, email string) string {
	m := hmac.New(sha256.New, u.salt)
	m.Write([]byte(tutorialID.String() + "|" + strings.ToLower(strings.TrimSpace(email))))
	return hex.EncodeToString(m.Sum(nil))
}

func (u *feedbackUsecase) Info(code string) (*dto.FormInfo, error) {
	t, err := u.repo.TutorialByCode(strings.ToUpper(strings.TrimSpace(code)))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &dto.FormInfo{TutorialName: t.Name, TutorName: t.TutorName, Open: t.IsDone && t.ShowFeedback}, nil
}

func (u *feedbackUsecase) Submit(code string, req dto.SubmitRequest) error {
	if strings.TrimSpace(req.UnclearTopics) == "" || strings.TrimSpace(req.Message) == "" {
		return ErrEmptyAnswer
	}
	t, err := u.repo.TutorialByCode(strings.ToUpper(strings.TrimSpace(code)))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if !t.IsDone || !t.ShowFeedback {
		return ErrClosed
	}
	f := &entity.Feedback{
		TutorialID:        t.ID,
		RespondentHash:    u.hash(t.ID, req.Email),
		DeliveryRating:    req.DeliveryRating,
		InteractiveRating: req.InteractiveRating,
		LearnAgainRating:  req.LearnAgainRating,
		UnclearTopics:     strings.TrimSpace(req.UnclearTopics),
		Message:           strings.TrimSpace(req.Message),
	}
	if err := u.repo.Create(f); err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			return ErrAlreadySubmitted
		}
		return err
	}
	return nil
}

func (u *feedbackUsecase) Status(tutorialID string, userID uuid.UUID, role string) (*dto.Status, error) {
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return nil, ErrNotFound
	}
	t, err := u.repo.TutorialByID(tid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	out := &dto.Status{Code: t.CustomID}
	if role != "student" || !t.IsDone || !t.ShowFeedback {
		return out, nil
	}
	ok, err := u.repo.IsAcceptedStudent(tid, userID)
	if err != nil || !ok {
		return out, err
	}
	email, err := u.repo.UserEmail(userID)
	if err != nil {
		return nil, err
	}
	done, err := u.repo.Exists(tid, u.hash(tid, email))
	if err != nil {
		return nil, err
	}
	out.Required = !done
	return out, nil
}

func (u *feedbackUsecase) Summary(tutorialID string, callerID uuid.UUID, role string) (*dto.Summary, error) {
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return nil, ErrNotFound
	}
	if role != "admin" {
		ok, err := u.repo.IsTutor(tid, callerID)
		if err != nil {
			return nil, err
		}
		if role != "tutor" || !ok {
			return nil, ErrNotFound
		}
	}
	rows, err := u.repo.List(tid)
	if err != nil {
		return nil, err
	}
	s := &dto.Summary{Count: len(rows), Items: make([]dto.Item, 0, len(rows))}
	var d, i, l int
	for _, f := range rows {
		d, i, l = d+f.DeliveryRating, i+f.InteractiveRating, l+f.LearnAgainRating
		s.Items = append(s.Items, dto.Item{
			DeliveryRating: f.DeliveryRating, InteractiveRating: f.InteractiveRating, LearnAgainRating: f.LearnAgainRating,
			UnclearTopics: f.UnclearTopics, Message: f.Message, CreatedAt: f.CreatedAt,
		})
	}
	if len(rows) > 0 {
		n := float64(len(rows))
		s.AvgDelivery, s.AvgInteractive, s.AvgLearnAgain = float64(d)/n, float64(i)/n, float64(l)/n
	}
	return s, nil
}
