package entity

import (
	"time"

	"github.com/google/uuid"
)

// Feedback is one anonymous answer to a finished tutorial. Who wrote it is never stored:
// RespondentHash is an HMAC of the tutorial and the respondent's email, kept only so the
// same person cannot answer twice.
type Feedback struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TutorialID        uuid.UUID `json:"tutorial_id" gorm:"type:uuid;not null;uniqueIndex:idx_feedback_respondent"`
	RespondentHash    string    `json:"-" gorm:"size:64;not null;uniqueIndex:idx_feedback_respondent"`
	DeliveryRating    int       `json:"delivery_rating" gorm:"not null"`
	InteractiveRating int       `json:"interactive_rating" gorm:"not null"`
	LearnAgainRating  int       `json:"learn_again_rating" gorm:"not null"`
	UnclearTopics     string    `json:"unclear_topics" gorm:"type:text"`
	Message           string    `json:"message" gorm:"type:text"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (Feedback) TableName() string { return "feedbacks" }
