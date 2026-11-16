package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type PendingValidationRepository interface {
	FindTutorialByCustomID(code string) (*tutorialEntity.Tutorial, error)
	FindTutorialByID(id uuid.UUID) (*tutorialEntity.Tutorial, error)
	FindByTutorialAndUser(tutorialID, userID uuid.UUID) (*entity.PendingValidation, error)
	FindByTutorialID(tutorialID uuid.UUID, params pagination.Params) ([]entity.PendingValidation, pagination.Meta, error)
	// FindGroupedByCreator returns, per tutorial created by creatorID, its enrollment requests.
	// Pagination is over tutorials. status, when set, keeps only requests in that state
	// (tutorials without a matching request are left out).
	FindGroupedByCreator(creatorID uuid.UUID, status *int, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error)
	Create(pv *entity.PendingValidation) error
	Update(pv *entity.PendingValidation) error
	// SetStatusForPending moves still-pending requests of the given students to status
	// and returns the user ids that were changed.
	SetStatusForPending(tutorialID uuid.UUID, userIDs []uuid.UUID, status int) ([]uuid.UUID, error)
}
