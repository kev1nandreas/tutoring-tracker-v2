package dto

import (
	"github.com/google/uuid"
)

type CreatePaymentRequest struct {
	TutorialID  uuid.UUID `json:"tutorial_id" binding:"required"`
	UserID      uuid.UUID `json:"user_id" binding:"required"`
	Nominal     int       `json:"nominal"`
	IsPaid      bool      `json:"is_paid"`
	PaymentDate int64     `json:"payment_date"`
	Note        string    `json:"note"`
}

type UpdatePaymentRequest struct {
	TutorialID  *uuid.UUID `json:"tutorial_id"`
	UserID      *uuid.UUID `json:"user_id"`
	Nominal     *int       `json:"nominal"`
	IsPaid      *bool      `json:"is_paid"`
	PaymentDate *int64     `json:"payment_date"`
	Note        *string    `json:"note"`
}
