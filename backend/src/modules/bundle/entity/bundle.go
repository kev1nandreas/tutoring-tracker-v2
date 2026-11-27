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

// Request is a request to download everything of one tutorial as a zip.
// Only the request is stored: the zip itself is never written anywhere. It is built
// on the fly, straight into the download, from the files already in storage.
type Request struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID uuid.UUID `json:"tutorial_id" gorm:"type:uuid;not null;index"`
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Status     string    `json:"status" gorm:"size:20;not null;index"`

	// Requester is the role that asked: "student" (empty on old rows) gets the package the
	// tutor configured; "tutor" or "admin" picked the contents themselves.
	Requester string `json:"requester" gorm:"size:20;not null;default:'student'"`

	// What goes into the package: copied from the tutorial for a student, chosen by a tutor.
	// No default of true on these: GORM leaves a false out of the INSERT when the column has
	// a default, so the database default would win over a deliberate false.
	IncludeRecordings bool `json:"include_recordings" gorm:"not null;default:false"`
	IncludeHomework   bool `json:"include_homework" gorm:"not null;default:false"`
	// SkipAttachments leaves the stored files out (summary PDF only). Stored inverted so old
	// rows, and the false GORM may drop, both mean "include the files".
	SkipAttachments bool `json:"skip_attachments" gorm:"not null;default:false"`

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
