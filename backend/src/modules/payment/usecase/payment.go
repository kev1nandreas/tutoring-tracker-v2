package usecase

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/dto"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/incomesync"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
)

const (
	incomeSource  = "Tutoring Tracker"
	syncTimeout   = 15 * time.Second
	statusPending = "pending"
	statusPaid    = "received"
)

type paymentUsecase struct {
	repo   repository.PaymentRepository
	income incomesync.Syncer
}

func NewPaymentUsecase(repo repository.PaymentRepository, income incomesync.Syncer) PaymentUsecase {
	return &paymentUsecase{repo: repo, income: income}
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

// checkTutorial reports a tutorial the tutor did not create as not found.
func (u *paymentUsecase) checkTutorial(tutorialID uuid.UUID, tutorID *uuid.UUID) error {
	if tutorID == nil {
		return nil
	}
	owned, err := u.repo.IsTutorialOwner(tutorialID, *tutorID)
	if err != nil {
		return err
	}
	if !owned {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// pushIncome copies the payment to the personal website as an income. The payment
// is already saved by now, so a failure is logged and does not fail the request.
func (u *paymentUsecase) pushIncome(p *entity.Payment) {
	name := "Tutoring payment"
	if p.Tutorial != nil {
		name = p.Tutorial.Name
	}

	due := p.CreatedAt
	if p.PaymentDate > 0 {
		due = time.Unix(p.PaymentDate, 0)
	}
	income := incomesync.Income{
		Name:    name,
		Source:  incomeSource,
		Amount:  p.Nominal,
		DueDate: due,
		Status:  statusPending,
		Note:    p.Note,
	}
	if p.User != nil {
		income.Note = joinNote("From "+p.User.Name, p.Note)
	}
	if p.IsPaid {
		income.Status = statusPaid
		income.PaymentDate = due
	}

	ctx, cancel := context.WithTimeout(context.Background(), syncTimeout)
	defer cancel()
	if err := u.income.Upsert(ctx, p.ID.String(), income); err != nil {
		log.Printf("income sync: payment %s not pushed: %v", p.ID, err)
	}
}

func (u *paymentUsecase) removeIncome(id uuid.UUID) {
	ctx, cancel := context.WithTimeout(context.Background(), syncTimeout)
	defer cancel()
	if err := u.income.Delete(ctx, id.String()); err != nil {
		log.Printf("income sync: payment %s not removed: %v", id, err)
	}
}

func joinNote(parts ...string) string {
	out := ""
	for _, p := range parts {
		if p == "" {
			continue
		}
		if out != "" {
			out += " - "
		}
		out += p
	}
	return out
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

func (u *paymentUsecase) Create(req dto.CreatePaymentRequest, tutorID *uuid.UUID) (*dto.PaymentResponse, error) {
	if err := u.checkTutorial(req.TutorialID, tutorID); err != nil {
		return nil, err
	}

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

	// Reload so the tutorial and student names are there.
	saved, err := u.repo.FindByID(payment.ID.String())
	if err != nil {
		return nil, err
	}
	u.pushIncome(saved)

	resp := dto.ToPaymentResponse(*saved)
	return &resp, nil
}

func (u *paymentUsecase) Update(id string, tutorID *uuid.UUID, req dto.UpdatePaymentRequest) (*dto.PaymentResponse, error) {
	payment, err := u.findOwned(id, tutorID)
	if err != nil {
		return nil, err
	}

	if req.TutorialID != nil {
		if err := u.checkTutorial(*req.TutorialID, tutorID); err != nil {
			return nil, err
		}
		payment.TutorialID = *req.TutorialID
	}
	if req.UserID != nil {
		payment.UserID = req.UserID
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

	saved, err := u.repo.FindByID(payment.ID.String())
	if err != nil {
		return nil, err
	}
	u.pushIncome(saved)

	resp := dto.ToPaymentResponse(*saved)
	return &resp, nil
}

func (u *paymentUsecase) Delete(id string, tutorID *uuid.UUID) error {
	payment, err := u.findOwned(id, tutorID)
	if err != nil {
		return err
	}

	if err := u.repo.Delete(payment); err != nil {
		return err
	}
	u.removeIncome(payment.ID)
	return nil
}
