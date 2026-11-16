package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

var tutorialSortColumns = map[string]bool{
	"id":              true,
	"custom_id":       true,
	"name":            true,
	"date_started":    true,
	"date_ended":      true,
	"meeting_days":    true,
	"is_done":         true,
	"description":     true,
	"show_download":   true,
	"show_attendance": true,
	"show_feedback":   true,
	"created_at":      true,
	"updated_at":      true,
}

type tutorialPostgresRepository struct {
	db *gorm.DB
}

func NewTutorialPostgresRepository(db *gorm.DB) TutorialRepository {
	return &tutorialPostgresRepository{db: db}
}

func (r *tutorialPostgresRepository) FindAll(params pagination.Params, creatorID *uuid.UUID) ([]entity.Tutorial, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !tutorialSortColumns[params.Sort] {
		params.Sort = ""
	}

	q := r.db
	if creatorID != nil {
		q = q.Where("created_by = ?", *creatorID)
	}

	var items []entity.Tutorial
	if _, meta, err := params.ApplyFiltered(q, &items, tutorialSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *tutorialPostgresRepository) FindByID(id string) (*entity.Tutorial, error) {
	var tutorial entity.Tutorial
	if err := r.db.Where("id = ?", id).First(&tutorial).Error; err != nil {
		return nil, err
	}
	return &tutorial, nil
}

func (r *tutorialPostgresRepository) Create(tutorial *entity.Tutorial) error {
	return r.db.Create(tutorial).Error
}

func (r *tutorialPostgresRepository) Update(tutorial *entity.Tutorial) error {
	return r.db.Save(tutorial).Error
}

func (r *tutorialPostgresRepository) Delete(tutorial *entity.Tutorial) error {
	return r.db.Delete(tutorial).Error
}

func (r *tutorialPostgresRepository) ExistsByCustomID(customID string) (bool, error) {
	var count int64
	err := r.db.Model(&entity.Tutorial{}).Where("custom_id = ?", customID).Count(&count).Error
	return count > 0, err
}

func (r *tutorialPostgresRepository) FindEnrolled(userID uuid.UUID, done *bool, today string, params pagination.Params) ([]dto.EnrolledTutorial, pagination.Meta, error) {
	// accepted students only (pending_validations.is_validated = 1)
	where := "pv.user_id = ? AND pv.is_validated = 1"
	args := []interface{}{userID}
	if done != nil {
		where += " AND t.is_done = ?"
		args = append(args, *done)
	}

	var total int64
	if err := r.db.Raw("SELECT COUNT(*) FROM tutorials t JOIN pending_validations pv ON pv.tutorial_id = t.id WHERE "+where, args...).
		Scan(&total).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	items := []dto.EnrolledTutorial{}
	queryArgs := append([]interface{}{today}, args...)
	queryArgs = append(queryArgs, params.PageSize, params.GetOffset())
	err := r.db.Raw(`
		SELECT t.id::text AS id, t.custom_id, t.name, COALESCE(t.description, '') AS description,
		       COALESCE(u.name, '') AS tutor_name,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       t.is_done,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id AND m.is_done) AS done_meetings,
		       COALESCE((SELECT to_char(MIN(m.date), 'YYYY-MM-DD') FROM meetings m
		         WHERE m.tutorial_id = t.id AND m.is_done = false AND m.date >= ?::date), '') AS next_meeting_date,
		       t.show_download AS can_download,
		       t.show_attendance AS can_attend
		FROM tutorials t
		JOIN pending_validations pv ON pv.tutorial_id = t.id
		LEFT JOIN users u ON u.id = t.created_by
		WHERE `+where+`
		ORDER BY t.is_done, t.date_started DESC, t.name
		LIMIT ? OFFSET ?`, queryArgs...).Scan(&items).Error
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	return items, params.BuildMeta(total), nil
}

func (r *tutorialPostgresRepository) FindEnrolledByID(userID, tutorialID uuid.UUID, today string) (*dto.EnrolledTutorial, error) {
	var item dto.EnrolledTutorial
	res := r.db.Raw(`
		SELECT t.id::text AS id, t.custom_id, t.name, COALESCE(t.description, '') AS description,
		       COALESCE(u.name, '') AS tutor_name,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       t.is_done,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id AND m.is_done) AS done_meetings,
		       COALESCE((SELECT to_char(MIN(m.date), 'YYYY-MM-DD') FROM meetings m
		         WHERE m.tutorial_id = t.id AND m.is_done = false AND m.date >= ?::date), '') AS next_meeting_date,
		       t.show_download AS can_download,
		       t.show_attendance AS can_attend
		FROM tutorials t
		JOIN pending_validations pv ON pv.tutorial_id = t.id
		LEFT JOIN users u ON u.id = t.created_by
		WHERE pv.user_id = ? AND pv.is_validated = 1 AND t.id = ?
		LIMIT 1`, today, userID, tutorialID).Scan(&item)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &item, nil
}

func (r *tutorialPostgresRepository) MeetingIDs(tutorialID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.Table("meetings").Where("tutorial_id = ?", tutorialID).Pluck("id", &ids).Error
	return ids, err
}
