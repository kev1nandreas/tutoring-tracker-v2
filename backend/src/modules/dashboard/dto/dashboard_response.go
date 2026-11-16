package dto

// Dates are "YYYY-MM-DD" and times "HH:MM" strings (no timezone surprises
// for the client). Empty string means "not set".

type MeetingItem struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Date         string `json:"date"`
	TimeStart    string `json:"time_start"`
	TimeEnd      string `json:"time_end"`
	HasHomework  bool   `json:"has_homework"`
	TutorialID   string `json:"tutorial_id"`
	TutorialName string `json:"tutorial_name"`
}

type TutorialItem struct {
	ID            string `json:"id"`
	CustomID      string `json:"custom_id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	DateStarted   string `json:"date_started"`
	DateEnded     string `json:"date_ended"`
	TotalMeetings int    `json:"total_meetings"`
	DoneMeetings  int    `json:"done_meetings"`
	// Tutor view: accepted students. Student view: always 0.
	Students int `json:"students"`
	// Student view: next meeting date of an enrolled tutorial, or whether the
	// student is enrolled in an upcoming one.
	NextMeetingDate string `json:"next_meeting_date"`
	IsEnrolled      bool   `json:"is_enrolled"`
}

type Income struct {
	ThisMonth     int64  `json:"this_month"`
	ThisYear      int64  `json:"this_year"`
	PaymentsMonth int    `json:"payments_month"`
	PaymentsYear  int    `json:"payments_year"`
	Month         string `json:"month"` // YYYY-MM
	Year          int    `json:"year"`
}

// PendingAttachment is a finished meeting that still has no attachment.
type PendingAttachment struct {
	MeetingID    string `json:"meeting_id"`
	Title        string `json:"title"`
	Date         string `json:"date"`
	TutorialID   string `json:"tutorial_id"`
	TutorialName string `json:"tutorial_name"`
}

// PendingHomework is a homework the student has not submitted yet.
type PendingHomework struct {
	MeetingID    string `json:"meeting_id"`
	Title        string `json:"title"`
	Date         string `json:"date"`
	TextHomework string `json:"text_homework"`
	TutorialID   string `json:"tutorial_id"`
	TutorialName string `json:"tutorial_name"`
}

type TutorDashboard struct {
	UpcomingMeetings   []MeetingItem       `json:"upcoming_meetings"`
	ActiveTutorials    []TutorialItem      `json:"active_tutorials"`
	Income             Income              `json:"income"`
	PendingAttachments []PendingAttachment `json:"pending_attachments"`
}

type StudentDashboard struct {
	PendingHomework   []PendingHomework `json:"pending_homework"`
	UpcomingTutorials []TutorialItem    `json:"upcoming_tutorials"`
	EnrolledTutorials []TutorialItem    `json:"enrolled_tutorials"`
}
