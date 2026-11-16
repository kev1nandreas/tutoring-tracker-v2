package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/entity"
	"gorm.io/gorm"
)

var ErrDuplicate = errors.New("feedback already submitted")

// TutorialInfo is the slice of a tutorial the feedback flow needs.
type TutorialInfo struct {
	ID           uuid.UUID
	CustomID     string
	Name         string
	TutorName    string
	IsDone       bool
	ShowFeedback bool
}

type FeedbackRepository interface {
	// TutorialByCode / TutorialByID return gorm.ErrRecordNotFound when missing.
	TutorialByCode(code string) (*TutorialInfo, error)
	TutorialByID(id uuid.UUID) (*TutorialInfo, error)
	UserEmail(userID uuid.UUID) (string, error)
	IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error)
	IsTutor(tutorialID, userID uuid.UUID) (bool, error)
	Exists(tutorialID uuid.UUID, hash string) (bool, error)
	// Create returns ErrDuplicate when that respondent already answered.
	Create(f *entity.Feedback) error
	List(tutorialID uuid.UUID) ([]entity.Feedback, error)
}

type feedbackPostgresRepository struct{ db *gorm.DB }

func NewFeedbackPostgresRepository(db *gorm.DB) FeedbackRepository {
	return &feedbackPostgresRepository{db: db}
}

const infoSelect = `SELECT t.id, t.custom_id, t.name, COALESCE(u.name, '') AS tutor_name, t.is_done, t.show_feedback
	FROM tutorials t LEFT JOIN users u ON u.id = t.created_by`

func (r *feedbackPostgresRepository) info(where string, arg interface{}) (*TutorialInfo, error) {
	var row TutorialInfo
	res := r.db.Raw(infoSelect+" WHERE "+where+" LIMIT 1", arg).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &row, nil
}

func (r *feedbackPostgresRepository) TutorialByCode(code string) (*TutorialInfo, error) {
	return r.info("t.custom_id = ?", code)
}

func (r *feedbackPostgresRepository) TutorialByID(id uuid.UUID) (*TutorialInfo, error) {
	return r.info("t.id = ?", id)
}

func (r *feedbackPostgresRepository) UserEmail(userID uuid.UUID) (string, error) {
	var email string
	err := r.db.Table("users").Select("email").Where("id = ?", userID).Limit(1).Scan(&email).Error
	return email, err
}

func (r *feedbackPostgresRepository) count(table, where string, args ...interface{}) (bool, error) {
	var n int64
	err := r.db.Table(table).Where(where, args...).Count(&n).Error
	return n > 0, err
}

func (r *feedbackPostgresRepository) IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error) {
	return r.count("pending_validations", "tutorial_id = ? AND user_id = ? AND is_validated = 1", tutorialID, userID)
}

func (r *feedbackPostgresRepository) IsTutor(tutorialID, userID uuid.UUID) (bool, error) {
	return r.count("tutorials", "id = ? AND created_by = ?", tutorialID, userID)
}

func (r *feedbackPostgresRepository) Exists(tutorialID uuid.UUID, hash string) (bool, error) {
	return r.count("feedbacks", "tutorial_id = ? AND respondent_hash = ?", tutorialID, hash)
}

func (r *feedbackPostgresRepository) Create(f *entity.Feedback) error {
	err := r.db.Create(f).Error
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrDuplicate
	}
	return err
}

func (r *feedbackPostgresRepository) List(tutorialID uuid.UUID) ([]entity.Feedback, error) {
	var items []entity.Feedback
	err := r.db.Where("tutorial_id = ?", tutorialID).Order("created_at DESC").Find(&items).Error
	return items, err
}
