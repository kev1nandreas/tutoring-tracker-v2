package repository

import (
	"strings"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/admin/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

// Removed is what a deleted user leaves in file storage, to sweep once the rows are gone.
type Removed struct {
	MeetingIDs []uuid.UUID // meetings of the tutorials the user created
	PhotoKeys  []string    // the user's attendance photos in other tutors' meetings
}

type AdminRepository interface {
	// List returns every user; search matches name, username, email or school, role filters by role name.
	List(search, role string, params pagination.Params) ([]dto.UserRow, pagination.Meta, error)
	// Find returns one user; gorm.ErrRecordNotFound when there is none.
	Find(id uuid.UUID) (*dto.UserRow, error)
	// Detail returns one user with their tutorials; gorm.ErrRecordNotFound when there is none.
	Detail(id uuid.UUID) (*dto.UserDetail, error)
	// Delete removes the user and everything that belongs to them, in one transaction.
	Delete(id uuid.UUID) (*Removed, error)
}

type adminPostgresRepository struct{ db *gorm.DB }

func NewAdminPostgresRepository(db *gorm.DB) AdminRepository {
	return &adminPostgresRepository{db: db}
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

const searchCond = `(u.name ILIKE ? ESCAPE '\' OR u.username ILIKE ? ESCAPE '\' OR u.email ILIKE ? ESCAPE '\' OR u.school ILIKE ? ESCAPE '\')`

// userSortColumns maps the ?sort= value to its ORDER BY expression.
var userSortColumns = map[string]string{
	"name":           "u.name",
	"email":          "u.email",
	"role":           "r.name",
	"last_login_at":  "u.last_login_at",
	"created_at":     "u.created_at",
	"tutorial_count": "tutorial_count",
}

func orderBy(params pagination.Params) string {
	expr, ok := userSortColumns[params.Sort]
	if !ok {
		return "u.created_at DESC, u.id ASC"
	}
	dir := "ASC"
	if params.Order == "desc" {
		dir = "DESC"
	}
	return expr + " " + dir + " NULLS LAST, u.name ASC, u.id ASC"
}

const selectRow = `SELECT u.id::text AS id, u.name, u.username, u.email, u.school, u.phone,
	COALESCE(r.name, '') AS role, u.last_login_at, u.created_at,
	CASE WHEN r.name = 'student'
	     THEN (SELECT COUNT(*) FROM pending_validations pv WHERE pv.user_id = u.id AND pv.is_validated = 1)
	     ELSE (SELECT COUNT(*) FROM tutorials t WHERE t.created_by = u.id) END AS tutorial_count
	FROM users u LEFT JOIN roles r ON r.id = u.role_id`

func (r *adminPostgresRepository) List(search, role string, params pagination.Params) ([]dto.UserRow, pagination.Meta, error) {
	where := "TRUE"
	args := []interface{}{}
	if search != "" {
		p := "%" + likeEscaper.Replace(search) + "%"
		where += " AND " + searchCond
		args = append(args, p, p, p, p)
	}
	if role != "" {
		where += " AND r.name = ?"
		args = append(args, role)
	}

	var total int64
	if err := r.db.Raw("SELECT COUNT(*) FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE "+where, args...).
		Scan(&total).Error; err != nil {
		return nil, pagination.Meta{}, err
	}

	rows := []dto.UserRow{}
	q := selectRow + " WHERE " + where + " ORDER BY " + orderBy(params) + " LIMIT ? OFFSET ?"
	if err := r.db.Raw(q, append(args, params.PageSize, params.GetOffset())...).Scan(&rows).Error; err != nil {
		return nil, pagination.Meta{}, err
	}
	return rows, params.BuildMeta(total), nil
}

func (r *adminPostgresRepository) Find(id uuid.UUID) (*dto.UserRow, error) {
	var row dto.UserRow
	res := r.db.Raw(selectRow+" WHERE u.id = ?", id).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &row, nil
}

func (r *adminPostgresRepository) Detail(id uuid.UUID) (*dto.UserDetail, error) {
	row, err := r.Find(id)
	if err != nil {
		return nil, err
	}
	out := &dto.UserDetail{UserRow: *row, Tutorials: []dto.UserTutorial{}}

	var flags struct {
		EmailVerified bool
		PasswordUnset bool
	}
	if err := r.db.Raw(`SELECT email_verified, password_unset FROM users WHERE id = ?`, id).Scan(&flags).Error; err != nil {
		return nil, err
	}
	out.EmailVerified, out.HasPassword = flags.EmailVerified, !flags.PasswordUnset

	// a student's requests, and the tutorials anyone created (a tutor or an admin)
	err = r.db.Raw(`
		SELECT t.id::text AS tutorial_id, t.custom_id, t.name, t.is_done,
		       COALESCE(tu.name, '') AS tutor_name,
		       CASE pv.is_validated WHEN 1 THEN 'accepted' WHEN 2 THEN 'declined' ELSE 'pending' END AS status,
		       0 AS student_count, t.created_at
		FROM pending_validations pv
		JOIN tutorials t ON t.id = pv.tutorial_id
		LEFT JOIN users tu ON tu.id = t.created_by
		WHERE pv.user_id = ?
		UNION ALL
		SELECT t.id::text, t.custom_id, t.name, t.is_done, '' , '',
		       (SELECT COUNT(*) FROM pending_validations pv WHERE pv.tutorial_id = t.id AND pv.is_validated = 1),
		       t.created_at
		FROM tutorials t
		WHERE t.created_by = ?
		ORDER BY created_at DESC`, id, id).Scan(&out.Tutorials).Error
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (r *adminPostgresRepository) Delete(id uuid.UUID) (*Removed, error) {
	out := &Removed{}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		owned := `SELECT id FROM tutorials WHERE created_by = ?`

		if err := tx.Raw(`SELECT id FROM meetings WHERE tutorial_id IN (`+owned+`)`, id).Scan(&out.MeetingIDs).Error; err != nil {
			return err
		}
		// photos inside the user's own tutorials go with the meeting folders already
		if err := tx.Raw(`SELECT a.photo_key FROM attendances a JOIN meetings m ON m.id = a.meeting_id
			JOIN tutorials t ON t.id = m.tutorial_id
			WHERE a.user_id = ? AND t.created_by IS DISTINCT FROM ?`, id, id).Scan(&out.PhotoKeys).Error; err != nil {
			return err
		}

		steps := []struct {
			sql  string
			args []interface{}
		}{
			// a tutor's tutorials, with their own payments; the database cascades
			// meetings, attachments, submissions, attendance, enrollments, bundles and feedback
			{`DELETE FROM payments WHERE tutorial_id IN (` + owned + `)`, []interface{}{id}},
			{`DELETE FROM tutorials WHERE created_by = ?`, []interface{}{id}},
			// a student's payments stay in the tutor's records, without the student
			{`UPDATE payments SET user_id = NULL WHERE user_id = ?`, []interface{}{id}},
			// files they uploaded to someone else's meeting stay with the meeting
			{`UPDATE attachments SET created_by = NULL WHERE created_by = ?`, []interface{}{id}},
			{`DELETE FROM attendances WHERE user_id = ?`, []interface{}{id}},
			{`DELETE FROM submissions WHERE user_id = ?`, []interface{}{id}},
			{`DELETE FROM pending_validations WHERE user_id = ?`, []interface{}{id}},
			{`DELETE FROM tutorial_students WHERE user_id = ?`, []interface{}{id}},
			{`DELETE FROM bundle_requests WHERE user_id = ?`, []interface{}{id}},
		}
		for _, s := range steps {
			if err := tx.Exec(s.sql, s.args...).Error; err != nil {
				return err
			}
		}

		res := tx.Exec(`DELETE FROM users WHERE id = ?`, id)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}
