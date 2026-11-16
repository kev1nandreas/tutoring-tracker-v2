package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/entity"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type attendancePostgresRepository struct {
	db *gorm.DB
}

func NewAttendancePostgresRepository(db *gorm.DB) AttendanceRepository {
	return &attendancePostgresRepository{db: db}
}

func (r *attendancePostgresRepository) MeetingInfo(meetingID uuid.UUID) (*MeetingInfo, error) {
	var row struct {
		TutorialID     uuid.UUID
		CreatedBy      *uuid.UUID
		ShowAttendance bool
		Date           string
	}
	res := r.db.Raw(`
		SELECT t.id AS tutorial_id, t.created_by, t.show_attendance,
		       to_char(m.date, 'YYYY-MM-DD') AS date
		FROM meetings m JOIN tutorials t ON t.id = m.tutorial_id
		WHERE m.id = ? LIMIT 1`, meetingID).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &MeetingInfo{TutorialID: row.TutorialID, CreatedBy: row.CreatedBy, ShowAttendance: row.ShowAttendance, Date: row.Date}, nil
}

func (r *attendancePostgresRepository) IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error) {
	var n int64
	err := r.db.Table("pending_validations").
		Where("tutorial_id = ? AND user_id = ? AND is_validated = 1", tutorialID, userID).
		Count(&n).Error
	return n > 0, err
}

func (r *attendancePostgresRepository) Find(meetingID, userID uuid.UUID) (*entity.Attendance, error) {
	var a entity.Attendance
	if err := r.db.Where("meeting_id = ? AND user_id = ?", meetingID, userID).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *attendancePostgresRepository) Save(a *entity.Attendance) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "meeting_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"photo_key", "content_type", "size", "updated_at"}),
	}).Create(a).Error
}

func (r *attendancePostgresRepository) Roster(meetingID, tutorialID uuid.UUID) ([]RosterRow, error) {
	var rows []struct {
		UserID    uuid.UUID
		Name      string
		Username  string
		PhotoKey  *string
		MarkedAt  *time.Time
		HasRecord bool
	}
	err := r.db.Raw(`
		SELECT u.id AS user_id, u.name, u.username,
		       a.photo_key, a.created_at AS marked_at, (a.id IS NOT NULL) AS has_record
		FROM pending_validations pv
		JOIN users u ON u.id = pv.user_id
		LEFT JOIN attendances a ON a.user_id = pv.user_id AND a.meeting_id = ?
		WHERE pv.tutorial_id = ? AND pv.is_validated = 1
		ORDER BY u.name`, meetingID, tutorialID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	out := make([]RosterRow, len(rows))
	for i, row := range rows {
		out[i] = RosterRow{UserID: row.UserID, Name: row.Name, Username: row.Username, HasRecord: row.HasRecord}
		if row.PhotoKey != nil {
			out[i].PhotoKey = *row.PhotoKey
		}
		if row.MarkedAt != nil {
			out[i].MarkedAt = row.MarkedAt
		}
	}
	return out, nil
}
