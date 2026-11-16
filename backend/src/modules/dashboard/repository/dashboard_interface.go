package repository

import "github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/dto"

// Clock is "now" in the app timezone, passed in so queries never depend on
// the database server's timezone.
type Clock struct {
	Today      string // YYYY-MM-DD
	Time       string // HH:MM:SS
	MonthStart int64  // unix seconds
	NextMonth  int64
	YearStart  int64
	NextYear   int64
}

type DashboardRepository interface {
	// Tutor. ownerID == "" means all tutorials (admin).
	UpcomingMeetings(ownerID string, c Clock, limit int) ([]dto.MeetingItem, error)
	ActiveTutorials(ownerID string, c Clock) ([]dto.TutorialItem, error)
	Income(ownerID string, c Clock) (dto.Income, error)
	PendingAttachments(ownerID string, c Clock, limit int) ([]dto.PendingAttachment, error)

	// Student.
	PendingHomework(userID string, c Clock, limit int) ([]dto.PendingHomework, error)
	UpcomingTutorials(userID string, c Clock, limit int) ([]dto.TutorialItem, error)
	EnrolledTutorials(userID string, c Clock) ([]dto.TutorialItem, error)
}
