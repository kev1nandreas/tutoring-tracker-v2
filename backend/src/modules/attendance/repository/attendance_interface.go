package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/entity"
)

// MeetingInfo is what decides who may do what with a meeting's attendance.
type MeetingInfo struct {
	TutorialID uuid.UUID
	CreatedBy  *uuid.UUID // the tutorial's tutor
	// ShowAttendance is the tutorial's switch: when off, there is no attendance at all.
	ShowAttendance bool
	Date           string // YYYY-MM-DD
}

// RosterRow is one accepted student with their check-in, if any.
type RosterRow struct {
	UserID    uuid.UUID
	Name      string
	Username  string
	PhotoKey  string // empty when not present
	MarkedAt  *time.Time
	HasRecord bool
}

type AttendanceRepository interface {
	// MeetingInfo returns gorm.ErrRecordNotFound when the meeting does not exist.
	MeetingInfo(meetingID uuid.UUID) (*MeetingInfo, error)
	IsAcceptedStudent(tutorialID, userID uuid.UUID) (bool, error)
	// Find returns gorm.ErrRecordNotFound when the student has not checked in.
	Find(meetingID, userID uuid.UUID) (*entity.Attendance, error)
	// Save inserts the check-in, or replaces the existing one of that student for the meeting.
	Save(a *entity.Attendance) error
	Roster(meetingID, tutorialID uuid.UUID) ([]RosterRow, error)
}
