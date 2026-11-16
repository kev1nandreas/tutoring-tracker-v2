package usecase

import (
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/repository"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

const (
	roleStudent = "student"
	roleTutor   = "tutor"
)

var (
	ErrForbidden       = errors.New("you are not allowed to do this")
	ErrNotFound        = errors.New("tutorial not found")
	ErrAlreadyEnrolled = errors.New("already enrolled or waiting for validation")
	ErrTutorialDone    = errors.New("tutorial is already finished")
)

// TypeEnrollment is the notification type used when a tutor decides on an enrollment request.
const TypeEnrollment = "enrollment"

// TypeEnrollmentRequest is the notification type used when a student asks to join a tutorial.
const TypeEnrollmentRequest = "enrollment"

// Sender delivers one notification (in-app, plus an email copy) to many users
// (implemented by the notification usecase).
type Sender interface {
	NotifyUsers(userIDs []uuid.UUID, notificationType, header, body string) error
}

type pendingValidationUsecase struct {
	repo   repository.PendingValidationRepository
	sender Sender
}

// NewPendingValidationUsecase builds the usecase. sender is optional: when nil, students
// are not notified.
func NewPendingValidationUsecase(repo repository.PendingValidationRepository, sender Sender) PendingValidationUsecase {
	return &pendingValidationUsecase{repo: repo, sender: sender}
}

func (u *pendingValidationUsecase) Enroll(callerID uuid.UUID, role string, req dto.EnrollRequest) (*entity.PendingValidation, error) {
	if role != roleStudent {
		return nil, ErrForbidden
	}

	code := strings.ToUpper(strings.TrimSpace(req.TutorialCode))
	tutorial, err := u.repo.FindTutorialByCustomID(code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if tutorial.IsDone {
		return nil, ErrTutorialDone
	}

	existing, err := u.repo.FindByTutorialAndUser(tutorial.ID, callerID)
	switch {
	case err == nil:
		// a declined student may ask again
		if existing.IsValidated != entity.StatusDeclined {
			return nil, ErrAlreadyEnrolled
		}
		existing.IsValidated = entity.StatusPending
		if err := u.repo.Update(existing); err != nil {
			return nil, err
		}
		u.notifyTutor(tutorial, callerID)
		return existing, nil
	case !errors.Is(err, gorm.ErrRecordNotFound):
		return nil, err
	}

	pv := &entity.PendingValidation{
		TutorialID:  tutorial.ID,
		UserID:      callerID,
		IsValidated: entity.StatusPending,
	}
	if err := u.repo.Create(pv); err != nil {
		return nil, err
	}
	u.notifyTutor(tutorial, callerID)
	return pv, nil
}

// notifyTutor tells the tutorial's creator that a student asked to join. Best effort:
// a failure is logged and never fails the enrollment.
func (u *pendingValidationUsecase) notifyTutor(tutorial *tutorialEntity.Tutorial, studentID uuid.UUID) {
	if u.sender == nil || tutorial.CreatedBy == nil {
		return
	}
	name, err := u.repo.FindUserName(studentID)
	if err != nil || name == "" {
		name = "A student"
	}
	body := fmt.Sprintf("%s asked to join \"%s\" (code %s). Review the request in Pending validation.", name, tutorial.Name, tutorial.CustomID)
	if err := u.sender.NotifyUsers([]uuid.UUID{*tutorial.CreatedBy}, TypeEnrollmentRequest, "New enrollment request", body); err != nil {
		log.Printf("pending validation: failed to notify tutor of tutorial %s: %v", tutorial.ID, err)
	}
}

func (u *pendingValidationUsecase) CountPending(callerID uuid.UUID, role string) (int64, error) {
	if role != roleTutor {
		return 0, ErrForbidden
	}
	return u.repo.CountPendingByCreator(callerID)
}

// requireOwner returns ErrForbidden unless the caller is a tutor who created the tutorial.
func requireOwner(callerID uuid.UUID, role string, tutorial *tutorialEntity.Tutorial) error {
	if role != roleTutor || tutorial.CreatedBy == nil || *tutorial.CreatedBy != callerID {
		return ErrForbidden
	}
	return nil
}

func (u *pendingValidationUsecase) FindMine(callerID uuid.UUID, role string, params pagination.Params) ([]dto.MyEnrollment, pagination.Meta, error) {
	if role != roleStudent {
		return nil, pagination.Meta{}, ErrForbidden
	}
	return u.repo.FindByUser(callerID, params)
}

func (u *pendingValidationUsecase) FindGrouped(callerID uuid.UUID, role string, status *int, search string, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error) {
	if role != roleTutor {
		return nil, pagination.Meta{}, ErrForbidden
	}
	return u.repo.FindGroupedByCreator(callerID, status, strings.TrimSpace(search), params)
}

func (u *pendingValidationUsecase) FindByTutorial(callerID uuid.UUID, role, tutorialID string, params pagination.Params) ([]dto.PendingStudent, pagination.Meta, error) {
	if role != roleTutor {
		return nil, pagination.Meta{}, ErrForbidden
	}
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return nil, pagination.Meta{}, ErrNotFound
	}
	tutorial, err := u.repo.FindTutorialByID(tid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pagination.Meta{}, ErrNotFound
		}
		return nil, pagination.Meta{}, err
	}
	if err := requireOwner(callerID, role, tutorial); err != nil {
		return nil, pagination.Meta{}, err
	}

	items, meta, err := u.repo.FindByTutorialID(tid, params)
	if err != nil {
		return nil, pagination.Meta{}, err
	}
	out := make([]dto.PendingStudent, len(items))
	for i, pv := range items {
		out[i] = dto.ToPendingStudent(pv)
	}
	return out, meta, nil
}

func (u *pendingValidationUsecase) Unenroll(callerID uuid.UUID, role, tutorialID, studentID string) error {
	if role != roleTutor {
		return ErrForbidden
	}
	tid, err := uuid.Parse(tutorialID)
	if err != nil {
		return ErrNotFound
	}
	sid, err := uuid.Parse(studentID)
	if err != nil {
		return ErrNotFound
	}
	tutorial, err := u.repo.FindTutorialByID(tid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if err := requireOwner(callerID, role, tutorial); err != nil {
		return err
	}

	removed, err := u.repo.RemoveAccepted(tid, sid)
	if err != nil {
		return err
	}
	if !removed {
		return ErrNotFound
	}
	return nil
}

func (u *pendingValidationUsecase) Validate(callerID uuid.UUID, role string, req dto.ValidateRequest) (*dto.ValidateResponse, error) {
	if role != roleTutor {
		return nil, ErrForbidden
	}
	tutorial, err := u.repo.FindTutorialByCustomID(strings.ToUpper(strings.TrimSpace(req.TutorialCode)))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if err := requireOwner(callerID, role, tutorial); err != nil {
		return nil, err
	}

	status := entity.StatusAccepted
	if req.Action == "decline" {
		status = entity.StatusDeclined
	}

	// dedupe, keep order
	seen := make(map[uuid.UUID]bool, len(req.UserIDs))
	ids := make([]uuid.UUID, 0, len(req.UserIDs))
	for _, id := range req.UserIDs {
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}

	changed, err := u.repo.SetStatusForPending(tutorial.ID, ids, status)
	if err != nil {
		return nil, err
	}

	// Tell the accepted students (in-app and by email). Best effort: a failure here is
	// logged and never undoes the validation.
	if status == entity.StatusAccepted && len(changed) > 0 && u.sender != nil {
		body := fmt.Sprintf("You were accepted into \"%s\" (code %s). You can now open its meetings and materials.", tutorial.Name, tutorial.CustomID)
		if err := u.sender.NotifyUsers(changed, TypeEnrollment, "Enrollment accepted", body); err != nil {
			log.Printf("pending validation: failed to notify accepted students of tutorial %s: %v", tutorial.ID, err)
		}
	}

	done := make(map[uuid.UUID]bool, len(changed))
	for _, id := range changed {
		done[id] = true
	}
	resp := &dto.ValidateResponse{Updated: []uuid.UUID{}, Skipped: []uuid.UUID{}}
	for _, id := range ids {
		if done[id] {
			resp.Updated = append(resp.Updated, id)
		} else {
			resp.Skipped = append(resp.Skipped, id)
		}
	}
	return resp, nil
}
