package repository

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/dto"
	"gorm.io/gorm"
)

// pending_validations.is_validated value meaning "accepted" (enrolled).
const accepted = 1

type dashboardPostgresRepository struct {
	db *gorm.DB
}

func NewDashboardPostgresRepository(db *gorm.DB) DashboardRepository {
	return &dashboardPostgresRepository{db: db}
}

// ownerClause limits tutorials (alias t) to the ones a tutor created.
// An empty owner matches every tutorial.
func ownerClause(owner string) (string, []interface{}) {
	if owner == "" {
		return "?::text = ''", []interface{}{owner}
	}
	return "t.created_by = ?::uuid", []interface{}{owner}
}

func (r *dashboardPostgresRepository) UpcomingMeetings(ownerID string, c Clock, limit int) ([]dto.MeetingItem, error) {
	own, ownArgs := ownerClause(ownerID)
	candidates := []dto.MeetingItem{}
	args := append([]interface{}{c.Today}, ownArgs...)
	args = append(args, limit+50)

	// time_start/time_end are formatted with to_char so this works whether the
	// column is `time` or `timestamptz`; the connection timezone is the app
	// timezone (see factory.NewDatabase). Today's already-finished meetings are
	// dropped below, in Go, instead of comparing time types in SQL.
	err := r.db.Raw(`
		SELECT m.id::text AS id, m.title,
		       to_char(m.date, 'YYYY-MM-DD') AS date,
		       to_char(m.time_start, 'HH24:MI') AS time_start,
		       to_char(m.time_end, 'HH24:MI') AS time_end,
		       m.has_homework,
		       t.id::text AS tutorial_id, t.name AS tutorial_name
		FROM meetings m
		JOIN tutorials t ON t.id = m.tutorial_id
		WHERE m.is_done = false AND t.is_done = false
		  AND m.date >= ?::date
		  AND `+own+`
		ORDER BY m.date, m.time_start
		LIMIT ?`, args...).Scan(&candidates).Error
	if err != nil {
		return nil, err
	}

	nowHM := c.Time
	if len(nowHM) > 5 {
		nowHM = nowHM[:5]
	}
	items := make([]dto.MeetingItem, 0, limit)
	for _, m := range candidates {
		if m.Date == c.Today && m.TimeEnd != "" && m.TimeEnd <= nowHM {
			continue // already over today
		}
		items = append(items, m)
		if len(items) == limit {
			break
		}
	}
	return items, nil
}

func (r *dashboardPostgresRepository) ActiveTutorials(ownerID string, c Clock) ([]dto.TutorialItem, error) {
	own, ownArgs := ownerClause(ownerID)
	items := []dto.TutorialItem{}
	args := append([]interface{}{accepted, c.Today}, ownArgs...)
	err := r.db.Raw(`
		SELECT t.id::text AS id, t.custom_id, t.name, COALESCE(t.description, '') AS description,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id AND m.is_done) AS done_meetings,
		       (SELECT COUNT(*) FROM pending_validations pv
		         WHERE pv.tutorial_id = t.id AND pv.is_validated = ?) AS students
		FROM tutorials t
		WHERE t.is_done = false AND t.date_started <= ?::date AND `+own+`
		ORDER BY t.date_started, t.name`, args...).Scan(&items).Error
	return items, err
}

func (r *dashboardPostgresRepository) Income(ownerID string, c Clock) (dto.Income, error) {
	own, ownArgs := ownerClause(ownerID)
	var row struct {
		ThisMonth     int64
		PaymentsMonth int
		ThisYear      int64
		PaymentsYear  int
	}
	args := append([]interface{}{c.MonthStart, c.NextMonth, c.MonthStart, c.NextMonth,
		c.YearStart, c.NextYear, c.YearStart, c.NextYear}, ownArgs...)
	err := r.db.Raw(`
		SELECT
		  COALESCE(SUM(p.nominal) FILTER (WHERE p.payment_date >= ? AND p.payment_date < ?), 0) AS this_month,
		  COUNT(*) FILTER (WHERE p.payment_date >= ? AND p.payment_date < ?) AS payments_month,
		  COALESCE(SUM(p.nominal) FILTER (WHERE p.payment_date >= ? AND p.payment_date < ?), 0) AS this_year,
		  COUNT(*) FILTER (WHERE p.payment_date >= ? AND p.payment_date < ?) AS payments_year
		FROM payments p
		JOIN tutorials t ON t.id = p.tutorial_id
		WHERE p.is_paid = true AND `+own, args...).Scan(&row).Error
	return dto.Income{
		ThisMonth: row.ThisMonth, PaymentsMonth: row.PaymentsMonth,
		ThisYear: row.ThisYear, PaymentsYear: row.PaymentsYear,
	}, err
}

func (r *dashboardPostgresRepository) PendingAttachments(ownerID string, c Clock, limit int) ([]dto.PendingAttachment, error) {
	own, ownArgs := ownerClause(ownerID)
	items := []dto.PendingAttachment{}
	args := append([]interface{}{c.Today}, ownArgs...)
	args = append(args, limit)
	err := r.db.Raw(`
		SELECT m.id::text AS meeting_id, m.title,
		       to_char(m.date, 'YYYY-MM-DD') AS date,
		       t.id::text AS tutorial_id, t.name AS tutorial_name
		FROM meetings m
		JOIN tutorials t ON t.id = m.tutorial_id
		WHERE t.is_done = false
		  AND (m.is_done = true OR m.date <= ?::date)
		  AND NOT EXISTS (SELECT 1 FROM attachments a WHERE a.meeting_id = m.id)
		  AND `+own+`
		ORDER BY m.date DESC
		LIMIT ?`, args...).Scan(&items).Error
	return items, err
}

func (r *dashboardPostgresRepository) PendingHomework(userID string, c Clock, limit int) ([]dto.PendingHomework, error) {
	items := []dto.PendingHomework{}
	err := r.db.Raw(`
		SELECT m.id::text AS meeting_id, m.title,
		       to_char(m.date, 'YYYY-MM-DD') AS date,
		       COALESCE(m.text_homework, '') AS text_homework,
		       t.id::text AS tutorial_id, t.name AS tutorial_name
		FROM meetings m
		JOIN tutorials t ON t.id = m.tutorial_id
		JOIN pending_validations pv
		  ON pv.tutorial_id = t.id AND pv.user_id = ?::uuid AND pv.is_validated = ?
		WHERE m.has_homework = true
		  AND (m.is_done = true OR m.date <= ?::date)
		  AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.meeting_id = m.id AND s.user_id = ?::uuid)
		ORDER BY m.date
		LIMIT ?`, userID, accepted, c.Today, userID, limit).Scan(&items).Error
	return items, err
}

func (r *dashboardPostgresRepository) UpcomingTutorials(userID string, c Clock, limit int) ([]dto.TutorialItem, error) {
	items := []dto.TutorialItem{}
	err := r.db.Raw(`
		SELECT t.id::text AS id, t.custom_id, t.name, COALESCE(t.description, '') AS description,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       EXISTS (SELECT 1 FROM pending_validations pv
		         WHERE pv.tutorial_id = t.id AND pv.user_id = ?::uuid AND pv.is_validated = ?) AS is_enrolled
		FROM tutorials t
		WHERE t.is_done = false AND t.date_started > ?::date
		ORDER BY t.date_started, t.name
		LIMIT ?`, userID, accepted, c.Today, limit).Scan(&items).Error
	return items, err
}

func (r *dashboardPostgresRepository) EnrolledTutorials(userID string, c Clock) ([]dto.TutorialItem, error) {
	items := []dto.TutorialItem{}
	err := r.db.Raw(`
		SELECT t.id::text AS id, t.custom_id, t.name, COALESCE(t.description, '') AS description,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id) AS total_meetings,
		       (SELECT COUNT(*) FROM meetings m WHERE m.tutorial_id = t.id AND m.is_done) AS done_meetings,
		       COALESCE((SELECT to_char(MIN(m.date), 'YYYY-MM-DD') FROM meetings m
		         WHERE m.tutorial_id = t.id AND m.is_done = false AND m.date >= ?::date), '') AS next_meeting_date,
		       true AS is_enrolled
		FROM tutorials t
		JOIN pending_validations pv
		  ON pv.tutorial_id = t.id AND pv.user_id = ?::uuid AND pv.is_validated = ?
		WHERE t.is_done = false AND t.date_started <= ?::date
		ORDER BY t.date_started, t.name`, c.Today, userID, accepted, c.Today).Scan(&items).Error
	return items, err
}
