package dto

import (
	"github.com/google/uuid"
)

type CreateNotificationRequest struct {
	UserID uuid.UUID `json:"user_id" binding:"required"`
	Type   string    `json:"type" binding:"required"`
	Header string    `json:"header" binding:"required"`
	Body   string    `json:"body" binding:"required"`
}
