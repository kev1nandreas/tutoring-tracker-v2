package entity

import (
	"time"

	"github.com/google/uuid"
)

// Statuses of a download request.
const (
	StatusQueued    = "queued"
	StatusPreparing = "preparing"
	StatusReady     = "ready"
	StatusFailed    = "failed"
)

// Request is a student's request to download everything of one tutorial as a zip.
// Only the request is stored: the zip itself is never written anywhere. It is built
// on the fly, straight into the download, from the files already in storage.
type Request struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID uuid.UUID `json:"tutorial_id" gorm:"type:uuid;not null;index"`
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Status     string    `json:"status" gorm:"size:20;not null;index"`

	// What goes into the summary PDF, copied from the tutorial when requested.
	IncludeRecordings bool `json:"include_recordings" gorm:"not null;default:false"`
	IncludeHomework   bool `json:"include_homework" gorm:"not null;default:true"`

	// Filled in by the worker.
	FileCount  int        `json:"file_count" gorm:"not null;default:0"`
	TotalBytes int64      `json:"total_bytes" gorm:"not null;default:0"`
	Error      string     `json:"error" gorm:"size:255"`
	ReadyAt    *time.Time `json:"ready_at"`
	ExpiresAt  *time.Time `json:"expires_at"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Request) TableName() string { return "bundle_requests" }
