package repository

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/entity"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var pendingValidationSortColumns = map[string]bool{
	"id":           true,
	"tutorial_id":  true,
	"user_id":      true,
	"is_validated": true,
	"created_at":   true,
	"updated_at":   true,
}

// searchCondition matches a student by name, username or school, case-insensitively.
const searchCondition = `(u.name ILIKE ? ESCAPE '\' OR u.username ILIKE ? ESCAPE '\' OR u.school ILIKE ? ESCAPE '\')`

// escapeLike makes %, _ and \ in user input match themselves.
var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func escapeLike(s string) string { return likeEscaper.Replace(s) }

type pendingValidationPostgresRepository struct {
	db *gorm.DB
}

func NewPendingValidationPostgresRepository(db *gorm.DB) PendingValidationRepository {
	return &pendingValidationPostgresRepository{db: db}
}

func (r *pendingValidationPostgresRepository) FindTutorialByCustomID(code string) (*tutorialEntity.Tutorial, error) {
	var t tutorialEntity.Tutorial
	if err := r.db.Where("custom_id = ?", code).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *pendingValidationPostgresRepository) FindTutorialByID(id uuid.UUID) (*tutorialEntity.Tutorial, error) {
	var t tutorialEntity.Tutorial
	if err := r.db.Where("id = ?", id).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *pendingValidationPostgresRepository) FindByTutorialAndUser(tutorialID, userID uuid.UUID) (*entity.PendingValidation, error) {
	var pv entity.PendingValidation
	if err := r.db.Where("tutorial_id = ? AND user_id = ?", tutorialID, userID).First(&pv).Error; err != nil {
		return nil, err
	}
	return &pv, nil
}

func (r *pendingValidationPostgresRepository) FindByTutorialID(tutorialID uuid.UUID, params pagination.Params) ([]entity.PendingValidation, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !pendingValidationSortColumns[params.Sort] {
		params.Sort = ""
	}

	var items []entity.PendingValidation
	q := r.db.Preload("User").Where("tutorial_id = ?", tutorialID)
	if _, meta, err := params.ApplyFiltered(q, &items, pendingValidationSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *pendingValidationPostgresRepository) Create(pv *entity.PendingValidation) error {
	return r.db.Create(pv).Error
}

func (r *pendingValidationPostgresRepository) Update(pv *entity.PendingValidation) error {
	return r.db.Save(pv).Error
}

func (r *pendingValidationPostgresRepository) SetStatusForPending(tutorialID uuid.UUID, userIDs []uuid.UUID, status int) ([]uuid.UUID, error) {
	var changed []uuid.UUID
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&entity.PendingValidation{}).
			Where("tutorial_id = ? AND user_id IN ? AND is_validated = ?", tutorialID, userIDs, entity.StatusPending).
			Pluck("user_id", &changed).Error; err != nil {
			return err
		}
		if len(changed) == 0 {
			return nil
		}
		if err := tx.Model(&entity.PendingValidation{}).
			Where("tutorial_id = ? AND user_id IN ? AND is_validated = ?", tutorialID, changed, entity.StatusPending).
			Update("is_validated", status).Error; err != nil {
			return err
		}

		// accepted students become members of the tutorial
		if status != entity.StatusAccepted {
			return nil
		}
		members := make([]tutorialEntity.TutorialStudent, len(changed))
		for i, id := range changed {
			members[i] = tutorialEntity.TutorialStudent{TutorialID: tutorialID, UserID: id}
		}
		return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&members).Error
	})
	return changed, err
}

func (r *pendingValidationPostgresRepository) FindGroupedByCreator(creatorID uuid.UUID, status *int, search string, params pagination.Params) ([]dto.TutorialPendingGroup, pagination.Meta, error) {
	// a tutorial is listed when it has at least one request matching status and search
	exists := "EXISTS (SELECT 1 FROM pending_validations pv JOIN users u ON u.id = pv.user_id WHERE pv.tutorial_id = tutorials.id"
	args := []interface{}{creatorID}
	if status != nil {
		exists += " AND pv.is_validated = ?"
		args = append(args, *status)
	}
	pattern := ""
	if search != "" {
		pattern = "%" + escapeLike(search) + "%"
		exists += " AND " + searchCondition
		args = append(args, pattern, pattern, pattern)
	}
	exists += ")"

	base := func() *gorm.DB {
		return r.db.Model(&tutorialEntity.Tutorial{}).Where("created_by = ? AND "+exists, args...)
	}

	var total int64
	if err := base().Count(&total).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	var tutorials []tutorialEntity.Tutorial
	if err := base().Order("created_at DESC").Limit(params.PageSize).Offset(params.GetOffset()).Find(&tutorials).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	groups := make([]dto.TutorialPendingGroup, 0, len(tutorials))
	if len(tutorials) == 0 {
		return groups, params.BuildMeta(total), nil
	}

	ids := make([]uuid.UUID, len(tutorials))
	index := make(map[uuid.UUID]int, len(tutorials))
	for i, t := range tutorials {
		ids[i] = t.ID
		index[t.ID] = i
		groups = append(groups, dto.TutorialPendingGroup{
			Tutorial:           dto.TutorialSummary{Name: t.Name, CustomID: t.CustomID},
			PendingValidations: []dto.PendingStudent{},
		})
	}

	q := r.db.Preload("User").
		Joins("JOIN users ON users.id = pending_validations.user_id").
		Where("pending_validations.tutorial_id IN ?", ids)
	if status != nil {
		q = q.Where("pending_validations.is_validated = ?", *status)
	}
	if pattern != "" {
		q = q.Where(strings.ReplaceAll(searchCondition, "u.", "users."), pattern, pattern, pattern)
	}
	var requests []entity.PendingValidation
	if err := q.Order("pending_validations.created_at ASC").Find(&requests).Error; err != nil {
		return nil, pagination.Meta{}, err
	}
	for _, pv := range requests {
		i := index[pv.TutorialID]
		groups[i].PendingValidations = append(groups[i].PendingValidations, dto.ToPendingStudent(pv))
	}

	return groups, params.BuildMeta(total), nil
}

func (r *pendingValidationPostgresRepository) FindByUser(userID uuid.UUID, params pagination.Params) ([]dto.MyEnrollment, pagination.Meta, error) {
	var total int64
	if err := r.db.Model(&entity.PendingValidation{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	var rows []struct {
		ID          string
		IsValidated int
		Name        string
		CustomID    string
		Description string
		DateStarted string
		DateEnded   string
		IsDone      bool
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}
	err := r.db.Raw(`
		SELECT pv.id::text AS id, pv.is_validated, pv.created_at, pv.updated_at,
		       t.name, t.custom_id, COALESCE(t.description, '') AS description,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       t.is_done
		FROM pending_validations pv
		JOIN tutorials t ON t.id = pv.tutorial_id
		WHERE pv.user_id = ?
		ORDER BY pv.updated_at DESC
		LIMIT ? OFFSET ?`, userID, params.PageSize, params.GetOffset()).Scan(&rows).Error
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	items := make([]dto.MyEnrollment, len(rows))
	for i, row := range rows {
		items[i] = dto.MyEnrollment{
			ID:     row.ID,
			Status: dto.StatusText(row.IsValidated),
			Tutorial: dto.EnrollmentTutorial{
				Name: row.Name, CustomID: row.CustomID, Description: row.Description,
				DateStarted: row.DateStarted, DateEnded: row.DateEnded, IsDone: row.IsDone,
			},
			RequestedAt: row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		}
	}
	return items, params.BuildMeta(total), nil
}
