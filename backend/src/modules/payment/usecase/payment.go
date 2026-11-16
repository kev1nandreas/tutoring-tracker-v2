package usecase

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

type paymentUsecase struct {
	repo repository.PaymentRepository
}

func NewPaymentUsecase(repo repository.PaymentRepository) PaymentUsecase {
	return &paymentUsecase{repo: repo}
}

// findOwned loads a payment; when tutorID is set, a payment of a tutorial the
// tutor did not create is reported as not found.
func (u *paymentUsecase) findOwned(id string, tutorID *uuid.UUID) (*entity.Payment, error) {
	payment, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if tutorID != nil {
		t := payment.Tutorial
		if t == nil || t.CreatedBy == nil || *t.CreatedBy != *tutorID {
			return nil, gorm.ErrRecordNotFound
		}
	}
	return payment, nil
}

func (u *paymentUsecase) FindAll(params pagination.Params, tutorID *uuid.UUID) ([]dto.PaymentResponse, pagination.Meta, error) {
	items, meta, err := u.repo.FindAll(params, tutorID)
	if err != nil {
		return nil, pagination.Meta{}, err
	}

	out := make([]dto.PaymentResponse, len(items))
	for i, item := range items {
		out[i] = dto.ToPaymentResponse(item)
	}
	return out, meta, nil
}

func (u *paymentUsecase) FindByID(id string, tutorID *uuid.UUID) (*dto.PaymentResponse, error) {
	payment, err := u.findOwned(id, tutorID)
	if err != nil {
		return nil, err
	}
	resp := dto.ToPaymentResponse(*payment)
	return &resp, nil
}

func (u *paymentUsecase) Create(req dto.CreatePaymentRequest) (*dto.PaymentResponse, error) {
	payment := &entity.Payment{
		TutorialID:  req.TutorialID,
		UserID:      req.UserID,
		Nominal:     req.Nominal,
		IsPaid:      req.IsPaid,
		PaymentDate: req.PaymentDate,
		Note:        req.Note,
	}

	if err := u.repo.Create(payment); err != nil {
		return nil, err
	}

	resp := dto.ToPaymentResponse(*payment)
	return &resp, nil
}

func (u *paymentUsecase) Update(id string, tutorID *uuid.UUID, req dto.UpdatePaymentRequest) (*dto.PaymentResponse, error) {
	payment, err := u.findOwned(id, tutorID)
	if err != nil {
		return nil, err
	}

	if req.TutorialID != nil {
		payment.TutorialID = *req.TutorialID
	}
	if req.UserID != nil {
		payment.UserID = *req.UserID
	}
	if req.Nominal != nil {
		payment.Nominal = *req.Nominal
	}
	if req.IsPaid != nil {
		payment.IsPaid = *req.IsPaid
	}
	if req.PaymentDate != nil {
		payment.PaymentDate = *req.PaymentDate
	}
	if req.Note != nil {
		payment.Note = *req.Note
	}

	if err := u.repo.Update(payment); err != nil {
		return nil, err
	}

	resp := dto.ToPaymentResponse(*payment)
	return &resp, nil
}

func (u *paymentUsecase) Delete(id string, tutorID *uuid.UUID) error {
	payment, err := u.findOwned(id, tutorID)
	if err != nil {
		return err
	}

	return u.repo.Delete(payment)
}
