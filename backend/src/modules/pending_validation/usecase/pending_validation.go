package usecase

import (
	"errors"
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

type pendingValidationUsecase struct {
	repo repository.PendingValidationRepository
}

func NewPendingValidationUsecase(repo repository.PendingValidationRepository) PendingValidationUsecase {
	return &pendingValidationUsecase{repo: repo}
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
	return pv, nil
}

// requireOwner returns ErrForbidden unless the caller is a tutor who created the tutorial.
func requireOwner(callerID uuid.UUID, role string, tutorial *tutorialEntity.Tutorial) error {
	if role != roleTutor || tutorial.CreatedBy == nil || *tutorial.CreatedBy != callerID {
		return ErrForbidden
	}
	return nil
}

func (u *pendingValidationUsecase) FindGrouped(callerID uuid.UUID, role string, status *int, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error) {
	if role != roleTutor {
		return nil, pagination.Meta{}, ErrForbidden
	}
	return u.repo.FindGroupedByCreator(callerID, status, params)
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
