package entity

import (
	"github.com/google/uuid"
	"time"
)

type Tutorial struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	CreatedBy      *uuid.UUID `json:"created_by" gorm:"type:uuid;index"`
	CustomID       string     `json:"custom_id" gorm:"size:6;not null;uniqueIndex"`
	Name           string     `json:"name" gorm:"size:100;not null"`
	DateStarted    time.Time  `json:"date_started" gorm:"type:date;not null"`
	DateEnded      time.Time  `json:"date_ended" gorm:"type:date;not null"`
	MeetingDays    int        `json:"meeting_days" gorm:"not null"`
	IsDone         bool       `json:"is_done" gorm:"not null;default:false"`
	Description    string     `json:"description" gorm:"size:255"`
	ShowDownload   bool       `json:"show_download" gorm:"not null;default:false"`
	ShowAttendance bool       `json:"show_attendance" gorm:"not null;default:false"`
	ShowFeedback   bool       `json:"show_feedback" gorm:"not null;default:false"`
	// What the "download everything" package contains besides the files (needs show_download):
	// the YouTube recording links, and the homework instructions with the student's own result.
	BundleIncludeRecordings bool      `json:"bundle_include_recordings" gorm:"not null;default:false"`
	BundleIncludeHomework   bool      `json:"bundle_include_homework" gorm:"not null;default:true"`
	CreatedAt               time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt               time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
