package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
)

type PaymentRepository interface {
	// FindAll lists payments; a non-nil tutorID limits it to payments of tutorials created by that user.
	FindAll(params pagination.Params, tutorID *uuid.UUID) ([]entity.Payment, pagination.Meta, error)
	FindByID(id string) (*entity.Payment, error)
	Create(payment *entity.Payment) error
	Update(payment *entity.Payment) error
	Delete(payment *entity.Payment) error
	// IsTutorialOwner reports whether the tutorial was created by that user.
	IsTutorialOwner(tutorialID, tutorID uuid.UUID) (bool, error)
}
