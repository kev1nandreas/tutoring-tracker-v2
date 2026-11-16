package entity

import (
	"time"

	"github.com/google/uuid"
	meetingEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
)

type Submission struct {
	ID        uuid.UUID             `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	MeetingID uuid.UUID             `json:"meeting_id" gorm:"type:uuid;not null"`
	Meeting   meetingEntity.Meeting `json:"-" gorm:"foreignKey:MeetingID;constraint:OnDelete:CASCADE"`
	UserID    uuid.UUID             `json:"user_id" gorm:"type:uuid;not null"`
	User      userEntity.User       `json:"-" gorm:"foreignKey:UserID"`
	Answer    string                `json:"answer" gorm:"type:text"`
	Files     string                `json:"files" gorm:"size:255;not null"`
	// Set by the tutor: 0-100, nil until graded.
	Grade     *int       `json:"grade" gorm:"type:smallint"`
	Feedback  string     `json:"feedback" gorm:"size:500"`
	GradedAt  *time.Time `json:"graded_at"`
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}
