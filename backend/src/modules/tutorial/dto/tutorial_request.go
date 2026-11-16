package dto

import (
	"time"
)

type CreateTutorialRequest struct {
	Name           string    `json:"name" binding:"required"`
	DateStarted    time.Time `json:"date_started" binding:"required"`
	DateEnded      time.Time `json:"date_ended" binding:"required"`
	MeetingDays    int       `json:"meeting_days"`
	IsDone         bool      `json:"is_done"`
	Description    string    `json:"description"`
	ShowDownload   bool      `json:"show_download"`
	ShowAttendance bool      `json:"show_attendance"`
	ShowFeedback   bool      `json:"show_feedback"`
}

type UpdateTutorialRequest struct {
	Name           *string    `json:"name"`
	DateStarted    *time.Time `json:"date_started"`
	DateEnded      *time.Time `json:"date_ended"`
	MeetingDays    *int       `json:"meeting_days"`
	IsDone         *bool      `json:"is_done"`
	Description    *string    `json:"description"`
	ShowDownload   *bool      `json:"show_download"`
	ShowAttendance *bool      `json:"show_attendance"`
	ShowFeedback   *bool      `json:"show_feedback"`
}
