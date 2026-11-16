package dto

import (
	"github.com/google/uuid"
	"time"
)

type TutorialResponse struct {
	ID             uuid.UUID `json:"id"`
	CustomID       string    `json:"custom_id"`
	Name           string    `json:"name"`
	DateStarted    time.Time `json:"date_started"`
	DateEnded      time.Time `json:"date_ended"`
	MeetingDays    int       `json:"meeting_days"`
	IsDone         bool      `json:"is_done"`
	Description    string    `json:"description"`
	ShowDownload   bool      `json:"show_download"`
	ShowAttendance bool      `json:"show_attendance"`
	ShowFeedback   bool      `json:"show_feedback"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
