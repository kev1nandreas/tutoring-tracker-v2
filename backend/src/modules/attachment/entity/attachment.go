package entity

import (
	"time"

	"github.com/google/uuid"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
)

type Attachment struct {
	ID        uuid.UUID             `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	MeetingID uuid.UUID             `json:"meeting_id" gorm:"type:uuid;not null"`
	Meeting   meetingEntity.Meeting `json:"-" gorm:"foreignKey:MeetingID;constraint:OnDelete:CASCADE"`
	CreatedBy *uuid.UUID            `json:"created_by" gorm:"type:uuid;index"`
	Name      string                `json:"name" gorm:"size:100;not null"`
	// Type is the category: ppt, picture, book, video or other.
	Type string `json:"type" gorm:"size:20;not null"`
	// Link is the MinIO object key (or, for old rows, an external URL).
	Link        string    `json:"link" gorm:"size:255;not null"`
	ContentType string    `json:"content_type" gorm:"size:100"`
	Size        int64     `json:"size" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
