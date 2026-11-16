package entity

import (
	"time"

	"github.com/google/uuid"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
)

// Validation states stored in PendingValidation.IsValidated.
const (
	StatusPending  = 0
	StatusAccepted = 1
	StatusDeclined = 2
)

type PendingValidation struct {
	ID          uuid.UUID        `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID  uuid.UUID        `json:"tutorial_id" gorm:"type:uuid;not null;uniqueIndex:idx_pending_tutorial_user"`
	UserID      uuid.UUID        `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_pending_tutorial_user"`
	User        *userEntity.User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	IsValidated int              `json:"is_validated" gorm:"not null;default:0"` // 0 pending, 1 accepted, 2 declined
	CreatedAt   time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
}
