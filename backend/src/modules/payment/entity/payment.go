package entity

import (
	"time"

	"github.com/google/uuid"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
	userEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/user/entity"
)

type Payment struct {
	ID          uuid.UUID                `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID  uuid.UUID                `json:"tutorial_id" gorm:"type:uuid;not null"`
	Tutorial    *tutorialEntity.Tutorial `json:"-" gorm:"foreignKey:TutorialID"`
	UserID      uuid.UUID                `json:"user_id" gorm:"type:uuid;not null"`
	User        *userEntity.User         `json:"-" gorm:"foreignKey:UserID"`
	Nominal     int                      `json:"nominal" gorm:"not null"`
	IsPaid      bool                     `json:"is_paid" gorm:"not null;default:false"`
	PaymentDate int64                    `json:"payment_date" gorm:"not null"`
	Note        string                   `json:"note" gorm:"size:100"`
	CreatedAt   time.Time                `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time                `json:"updated_at" gorm:"autoUpdateTime"`
}
