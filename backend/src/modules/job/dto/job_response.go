package dto

import (
	"github.com/google/uuid"
	"time"
)

type JobResponse struct {
	ID        uuid.UUID `json:"id"`
	IsSuccess bool      `json:"is_success"`
	Messages  string    `json:"messages"`
	StartTime time.Time `json:"start_time"`
	EndTime   int       `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
