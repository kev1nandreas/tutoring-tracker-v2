package entity

import (
	"time"

	"github.com/google/uuid"
	tutorialEntity "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/entity"
)

type Meeting struct {
	ID           uuid.UUID               `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID   uuid.UUID               `json:"tutorial_id" gorm:"type:uuid;not null"`
	Tutorial     tutorialEntity.Tutorial `json:"-" gorm:"foreignKey:TutorialID"`
	Title        string                  `json:"title" gorm:"size:100;not null"`
	Date         time.Time               `json:"date" gorm:"type:date;not null"`
	YoutubeLink  string                  `json:"youtube_link" gorm:"size:100;not null"`
	TimeStart    time.Time               `json:"time_start" gorm:"type:time;not null"`
	TimeEnd      time.Time               `json:"time_end" gorm:"type:time;not null"`
	IsDone       bool                    `json:"is_done" gorm:"not null;default:false"`
	Marks        string                  `json:"marks" gorm:"size:255"`
	HasHomework  bool                    `json:"has_homework" gorm:"not null;default:false"`
	TextHomework string                  `json:"text_homework" gorm:"size:255"`
	CreatedAt    time.Time               `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time               `json:"updated_at" gorm:"autoUpdateTime"`
}
