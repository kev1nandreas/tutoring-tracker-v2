package repository

import (
	"strings"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/student/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

type StudentRepository interface {
	// List returns the users accepted into any of the tutor's tutorials (any tutorial for
	// uuid.Nil, an admin); search matches name, username, email or school.
	List(tutorID uuid.UUID, search string, params pagination.Params) ([]dto.StudentRow, pagination.Meta, error)
	// Detail returns one user who has a request in any of the tutor's tutorials (any tutorial
	// for uuid.Nil, an admin); gorm.ErrRecordNotFound otherwise.
	Detail(tutorID, studentID uuid.UUID) (*dto.StudentDetail, error)
}

type studentPostgresRepository struct{ db *gorm.DB }

func NewStudentPostgresRepository(db *gorm.DB) StudentRepository {
	return &studentPostgresRepository{db: db}
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

const searchCond = `(u.name ILIKE ? ESCAPE '\' OR u.username ILIKE ? ESCAPE '\' OR u.email ILIKE ? ESCAPE '\' OR u.school ILIKE ? ESCAPE '\')`

// studentSortColumns maps the ?sort= value to its ORDER BY expression.
var studentSortColumns = map[string]string{
	"name":           "u.name",
	"email":          "u.email",
	"school":         "u.school",
	"last_login_at":  "u.last_login_at",
	"tutorial_count": "tutorial_count",
}

// studentOrderBy builds a safe ORDER BY; unknown columns fall back to name.
func studentOrderBy(params pagination.Params) string {
	expr, ok := studentSortColumns[params.Sort]
	if !ok {
		return "u.name ASC, u.id ASC"
	}
	dir := "ASC"
	if params.Order == "desc" {
		dir = "DESC"
	}
	// never-logged-in students go last either way
	return expr + " " + dir + " NULLS LAST, u.name ASC, u.id ASC"
}

func (r *studentPostgresRepository) List(tutorID uuid.UUID, search string, params pagination.Params) ([]dto.StudentRow, pagination.Meta, error) {
	where, args := "t.created_by = ? AND pv.is_validated = 1", []interface{}{tutorID}
	if tutorID == uuid.Nil { // an admin: students of every tutor
		where, args = "pv.is_validated = 1", []interface{}{}
	}
	if search != "" {
		p := "%" + likeEscaper.Replace(search) + "%"
		where += " AND " + searchCond
		args = append(args, p, p, p, p)
	}
	from := `FROM users u
		JOIN pending_validations pv ON pv.user_id = u.id
		JOIN tutorials t ON t.id = pv.tutorial_id
		WHERE ` + where

	var total int64
	if err := r.db.Raw("SELECT COUNT(DISTINCT u.id) "+from, args...).Scan(&total).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	rows := []dto.StudentRow{}
	q := `SELECT u.id::text AS id, u.name, u.username, u.email, u.school, u.phone, u.last_login_at,
		COUNT(DISTINCT pv.tutorial_id) AS tutorial_count ` + from + `
		GROUP BY u.id ORDER BY ` + studentOrderBy(params) + ` LIMIT ? OFFSET ?`
	if err := r.db.Raw(q, append(args, params.PageSize, params.GetOffset())...).Scan(&rows).Error; err != nil {
		return nil, pagination.Meta{}, err
	}
	return rows, params.BuildMeta(total), nil
}

func (r *studentPostgresRepository) Detail(tutorID, studentID uuid.UUID) (*dto.StudentDetail, error) {
	owner, args := "t.created_by = ? AND ", []interface{}{tutorID, studentID}
	if tutorID == uuid.Nil { // an admin: every tutor's tutorials
		owner, args = "", []interface{}{studentID}
	}
	tutorials := []dto.StudentTutorial{}
	err := r.db.Raw(`
		SELECT t.id::text AS tutorial_id, t.custom_id, t.name, t.is_done,
		       CASE pv.is_validated WHEN 1 THEN 'accepted' WHEN 2 THEN 'declined' ELSE 'pending' END AS status,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       (SELECT COUNT(*) FROM attendances a JOIN meetings m ON m.id = a.meeting_id
		         WHERE m.tutorial_id = t.id AND a.user_id = pv.user_id) AS attended,
		       (SELECT COUNT(*) FROM submissions s JOIN meetings m ON m.id = s.meeting_id
		         WHERE m.tutorial_id = t.id AND s.user_id = pv.user_id) AS submitted,
		       (SELECT AVG(s.grade)::float8 FROM submissions s JOIN meetings m ON m.id = s.meeting_id
		         WHERE m.tutorial_id = t.id AND s.user_id = pv.user_id AND s.grade IS NOT NULL) AS avg_grade
		FROM pending_validations pv JOIN tutorials t ON t.id = pv.tutorial_id
		WHERE `+owner+`pv.user_id = ?
		ORDER BY t.created_at DESC`, args...).Scan(&tutorials).Error
	if err != nil {
		return nil, err
	}
	if len(tutorials) == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var row dto.StudentRow
	res := r.db.Raw(`SELECT id::text AS id, name, username, email, school, phone, last_login_at FROM users WHERE id = ?`, studentID).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	row.TutorialCount = len(tutorials)
	return &dto.StudentDetail{StudentRow: row, Tutorials: tutorials}, nil
}
