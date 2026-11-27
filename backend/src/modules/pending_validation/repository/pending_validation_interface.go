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
	// FindGroupedByCreator returns, per tutorial created by creatorID (every tutorial for
	// uuid.Nil), its enrollment requests.
	// Pagination is over tutorials. status, when set, keeps only requests in that state
	// (tutorials without a matching request are left out). search, when not empty, keeps only
	// students whose name, username or school contains it (case-insensitive).
	FindGroupedByCreator(creatorID uuid.UUID, status *int, search string, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error)
	// FindByUser lists the user's own enrollment requests with their tutorial, newest change first.
	FindByUser(userID uuid.UUID, params pagination.Params) ([]dto.MyEnrollment, pagination.Meta, error)
	// CountPendingByCreator counts the still-pending requests across all tutorials created by
	// creatorID (every tutorial for uuid.Nil).
	CountPendingByCreator(creatorID uuid.UUID) (int64, error)
	// FindUserName returns the display name of a user.
	FindUserName(userID uuid.UUID) (string, error)
	Create(pv *entity.PendingValidation) error
	Update(pv *entity.PendingValidation) error
	// SetStatusForPending moves still-pending requests of the given students to status
	// and returns the user ids that were changed.
	SetStatusForPending(tutorialID uuid.UUID, userIDs []uuid.UUID, status int) ([]uuid.UUID, error)
	// RemoveAccepted unenrolls an accepted student: it deletes the request and the
	// membership, so the student can ask to join again later. It reports whether the
	// student was enrolled. Attendance and homework are kept.
	RemoveAccepted(tutorialID, userID uuid.UUID) (bool, error)
}
