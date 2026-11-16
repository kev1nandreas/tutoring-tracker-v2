package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
)

// PaymentTutorial is the only tutorial info exposed with a payment.
type PaymentTutorial struct {
	Name        string    `json:"name"`
	DateStarted time.Time `json:"date_started"`
	DateEnded   time.Time `json:"date_ended"`
}

type PaymentResponse struct {
	ID          uuid.UUID        `json:"id"`
	TutorialID  uuid.UUID        `json:"tutorial_id"`
	Tutorial    *PaymentTutorial `json:"tutorial,omitempty"`
	UserID      *uuid.UUID       `json:"user_id"`
	StudentName string           `json:"student_name,omitempty"`
	Nominal     int              `json:"nominal"`
	IsPaid      bool             `json:"is_paid"`
	PaymentDate int64            `json:"payment_date"`
	Note        string           `json:"note"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

// ToPaymentResponse maps an entity; tutorial and student info are included when Tutorial and User are preloaded.
func ToPaymentResponse(p entity.Payment) PaymentResponse {
	out := PaymentResponse{
		ID:          p.ID,
		TutorialID:  p.TutorialID,
		UserID:      p.UserID,
		Nominal:     p.Nominal,
		IsPaid:      p.IsPaid,
		PaymentDate: p.PaymentDate,
		Note:        p.Note,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
	if p.User != nil {
		out.StudentName = p.User.Name
	}
	if p.Tutorial != nil {
		out.Tutorial = &PaymentTutorial{
			Name:        p.Tutorial.Name,
			DateStarted: p.Tutorial.DateStarted,
			DateEnded:   p.Tutorial.DateEnded,
		}
	}
	return out
}
