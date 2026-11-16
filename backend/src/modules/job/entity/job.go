package entity

import (
	"github.com/google/uuid"
	"time"
)

type Job struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	IsSuccess bool      `json:"is_success" gorm:"not null;default:false"`
	Messages  string    `json:"messages" gorm:"size:300;not null"`
	StartTime time.Time `json:"start_time" gorm:"not null"`
	EndTime   int       `json:"end_time" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
