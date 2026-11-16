package dto

// EnrolledTutorial is a tutorial the student was accepted into, with their progress.
// Dates are "YYYY-MM-DD"; NextMeetingDate is empty when nothing is scheduled.
type EnrolledTutorial struct {
	ID              string `json:"id"`
	CustomID        string `json:"custom_id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	TutorName       string `json:"tutor_name"`
	DateStarted     string `json:"date_started"`
	DateEnded       string `json:"date_ended"`
	IsDone          bool   `json:"is_done"`
	TotalMeetings   int    `json:"total_meetings"`
	DoneMeetings    int    `json:"done_meetings"`
	NextMeetingDate string `json:"next_meeting_date"`
}
