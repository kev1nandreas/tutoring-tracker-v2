package entity

import (
	"time"

	"github.com/google/uuid"
)

// Notification is stored in MongoDB.
type Notification struct {
	ID        uuid.UUID `json:"id" bson:"_id"`
	UserID    uuid.UUID `json:"user_id" bson:"user_id"`
	Type      string    `json:"type" bson:"type"`
	Header    string    `json:"header" bson:"header"`
	Body      string    `json:"body" bson:"body"`
	IsRead    bool      `json:"is_read" bson:"is_read"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
