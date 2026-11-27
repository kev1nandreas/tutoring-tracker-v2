package entity

import (
	"time"

	"github.com/google/uuid"
	roleEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/role/entity"
)

type User struct {
	ID       uuid.UUID       `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	RoleID   uuid.UUID       `json:"role_id" gorm:"type:uuid;not null"`
	Role     roleEntity.Role `json:"role,omitempty" gorm:"foreignKey:RoleID"`
	Name     string          `json:"name" gorm:"size:100;not null"`
	School   string          `json:"school" gorm:"size:100;not null"`
	Phone    string          `json:"phone" gorm:"size:13;not null"`
	Email    string          `json:"email" gorm:"size:100;not null"`
	Username string          `json:"username" gorm:"size:50;not null;unique"`
	Password string          `json:"-" gorm:"not null"`
	// EmailVerified: Google sign-ups start verified; others must follow the emailed link.
	EmailVerified bool `json:"email_verified" gorm:"not null;default:false"`
	// EmailNotifications: send a copy of notifications by email (only while EmailVerified).
	EmailNotifications bool `json:"email_notifications" gorm:"not null;default:true"`
	// PasswordUnset: a Google sign-up whose password is a random one nobody knows, until
	// they set their own. Stored this way round so the default (false) means "has one".
	PasswordUnset bool       `json:"-" gorm:"not null;default:false"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	CreatedAt     time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}
