package entity

import (
	"time"

	"github.com/google/uuid"
)

// TutorialStudent is the many-to-many link between a tutorial and a student.
// A row exists only after the tutor accepted the student's enrollment request.
type TutorialStudent struct {
	TutorialID uuid.UUID `json:"tutorial_id" gorm:"type:uuid;primaryKey"`
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey;index"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (TutorialStudent) TableName() string {
	return "tutorial_students"
}
