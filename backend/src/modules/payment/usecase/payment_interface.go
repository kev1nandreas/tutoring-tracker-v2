package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type PaymentUsecase interface {
	// A non-nil tutorID limits access to payments of tutorials created by that user;
	// other payments behave as not found.
	FindAll(params pagination.Params, tutorID *uuid.UUID) ([]dto.PaymentResponse, pagination.Meta, error)
	FindByID(id string, tutorID *uuid.UUID) (*dto.PaymentResponse, error)
	Create(req dto.CreatePaymentRequest, tutorID *uuid.UUID) (*dto.PaymentResponse, error)
	Update(id string, tutorID *uuid.UUID, req dto.UpdatePaymentRequest) (*dto.PaymentResponse, error)
	Delete(id string, tutorID *uuid.UUID) error
}
