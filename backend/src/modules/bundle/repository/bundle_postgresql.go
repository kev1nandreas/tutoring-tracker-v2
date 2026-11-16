package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/entity"
	"gorm.io/gorm"
)

type bundlePostgresRepository struct {
	db *gorm.DB
}

func NewBundlePostgresRepository(db *gorm.DB) BundleRepository {
	return &bundlePostgresRepository{db: db}
}

func (r *bundlePostgresRepository) Access(tutorialID, userID uuid.UUID) (*Access, error) {
	var row struct {
		Name              string
		ShowDownload      bool
		IncludeRecordings bool
		IncludeHomework   bool
		Accepted          bool
	}
	res := r.db.Raw(`
		SELECT t.name, t.show_download,
		       t.bundle_include_recordings AS include_recordings,
		       t.bundle_include_homework AS include_homework,
		       EXISTS (SELECT 1 FROM pending_validations pv
		                WHERE pv.tutorial_id = t.id AND pv.user_id = ? AND pv.is_validated = 1) AS accepted
		FROM tutorials t
		WHERE t.id = ?
		LIMIT 1`, userID, tutorialID).Scan(&row)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &Access{
		TutorialName:      row.Name,
		Accepted:          row.Accepted,
		ShowDownload:      row.ShowDownload,
		IncludeRecordings: row.IncludeRecordings,
		IncludeHomework:   row.IncludeHomework,
	}, nil
}

func (r *bundlePostgresRepository) FindActive(tutorialID, userID uuid.UUID, now time.Time) (*entity.Request, error) {
	var req entity.Request
	err := r.db.
		Where("tutorial_id = ? AND user_id = ?", tutorialID, userID).
		Where("status IN ? OR (status = ? AND expires_at > ?)",
			[]string{entity.StatusQueued, entity.StatusPreparing}, entity.StatusReady, now).
		Order("created_at DESC").
		First(&req).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *bundlePostgresRepository) FindByID(id uuid.UUID) (*entity.Request, error) {
	var req entity.Request
	if err := r.db.Where("id = ?", id).First(&req).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *bundlePostgresRepository) Create(req *entity.Request) error { return r.db.Create(req).Error }
func (r *bundlePostgresRepository) Save(req *entity.Request) error   { return r.db.Save(req).Error }

func (r *bundlePostgresRepository) Plan(tutorialID, userID uuid.UUID) (*Plan, error) {
	var head struct {
		Name, CustomID, Description, TutorName, DateStarted, DateEnded string
	}
	res := r.db.Raw(`
		SELECT t.name, t.custom_id, COALESCE(t.description, '') AS description,
		       COALESCE(u.name, '') AS tutor_name,
		       to_char(t.date_started, 'YYYY-MM-DD') AS date_started,
		       to_char(t.date_ended, 'YYYY-MM-DD') AS date_ended
		FROM tutorials t LEFT JOIN users u ON u.id = t.created_by
		WHERE t.id = ? LIMIT 1`, tutorialID).Scan(&head)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var student struct{ Name, School string }
	if err := r.db.Raw(`SELECT name, COALESCE(school, '') AS school FROM users WHERE id = ?`, userID).Scan(&student).Error; err != nil {
		return nil, err
	}

	plan := &Plan{
		TutorialName: head.Name, Code: head.CustomID, Description: head.Description,
		TutorName: head.TutorName, DateStarted: head.DateStarted, DateEnded: head.DateEnded,
		StudentName: student.Name, StudentSchool: student.School,
	}

	var meetings []struct {
		ID          uuid.UUID
		Title       string
		Date        string
		TimeStart   string
		TimeEnd     string
		IsDone      bool
		HasHomework bool
		Homework    string
		YoutubeLink string
	}
	if err := r.db.Raw(`
		SELECT m.id, m.title,
		       to_char(m.date, 'YYYY-MM-DD') AS date,
		       to_char(m.time_start, 'HH24:MI') AS time_start,
		       to_char(m.time_end, 'HH24:MI') AS time_end,
		       m.is_done, m.has_homework,
		       COALESCE(m.text_homework, '') AS homework,
		       COALESCE(m.youtube_link, '') AS youtube_link
		FROM meetings m WHERE m.tutorial_id = ?
		ORDER BY m.date, m.time_start`, tutorialID).Scan(&meetings).Error; err != nil {
		return nil, err
	}
	if len(meetings) == 0 {
		return plan, nil
	}

	index := make(map[uuid.UUID]int, len(meetings))
	ids := make([]uuid.UUID, len(meetings))
	plan.Meetings = make([]Meeting, len(meetings))
	for i, m := range meetings {
		index[m.ID], ids[i] = i, m.ID
		plan.Meetings[i] = Meeting{
			ID: m.ID, Title: m.Title, Date: m.Date, TimeStart: m.TimeStart, TimeEnd: m.TimeEnd,
			IsDone: m.IsDone, HasHomework: m.HasHomework, Homework: m.Homework, YoutubeLink: m.YoutubeLink,
		}
	}

	var files []struct {
		MeetingID uuid.UUID
		Name      string
		Type      string
		Link      string
		Size      int64
	}
	if err := r.db.Raw(`
		SELECT meeting_id, name, type, link, size FROM attachments
		WHERE meeting_id IN ? AND link NOT LIKE 'http%' ORDER BY created_at`, ids).Scan(&files).Error; err != nil {
		return nil, err
	}
	for _, f := range files {
		i := index[f.MeetingID]
		plan.Meetings[i].Files = append(plan.Meetings[i].Files, File{Name: f.Name, Type: f.Type, Key: f.Link, Size: f.Size})
	}

	var subs []struct {
		MeetingID uuid.UUID
		CreatedAt time.Time
		Answer    string
		Grade     *int
		Feedback  string
	}
	if err := r.db.Raw(`
		SELECT meeting_id, created_at, COALESCE(answer, '') AS answer, grade, COALESCE(feedback, '') AS feedback
		FROM submissions WHERE meeting_id IN ? AND user_id = ?`, ids, userID).Scan(&subs).Error; err != nil {
		return nil, err
	}
	for _, s := range subs {
		i := index[s.MeetingID]
		plan.Meetings[i].Submission = &Submission{SubmittedAt: s.CreatedAt, Answer: s.Answer, Grade: s.Grade, Feedback: s.Feedback}
	}

	return plan, nil
}
