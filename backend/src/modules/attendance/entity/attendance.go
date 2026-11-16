package entity

import (
	"time"

	"github.com/google/uuid"
)

// Attendance is a student's check-in to one meeting, proven by a photo kept in storage.
// There is at most one per student per meeting; a new photo replaces the old one.
type Attendance struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	MeetingID uuid.UUID `json:"meeting_id" gorm:"type:uuid;not null;uniqueIndex:idx_attendance_meeting_user"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_attendance_meeting_user"`
	// PhotoKey is the object key under meetings/<meeting id>/attendance/.
	PhotoKey    string    `json:"-" gorm:"size:255;not null"`
	ContentType string    `json:"content_type" gorm:"size:100"`
	Size        int64     `json:"size" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Attendance) TableName() string { return "attendances" }
