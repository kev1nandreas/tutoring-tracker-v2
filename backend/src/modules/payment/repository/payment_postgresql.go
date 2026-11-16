package repository

import (
	"github.com/google/uuid"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/entity"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var paymentSortColumns = map[string]bool{
	"id":           true,
	"tutorial_id":  true,
	"user_id":      true,
	"nominal":      true,
	"is_paid":      true,
	"payment_date": true,
	"note":         true,
	"created_at":   true,
	"updated_at":   true,
}

type paymentPostgresRepository struct {
	db *gorm.DB
}

func NewPaymentPostgresRepository(db *gorm.DB) PaymentRepository {
	return &paymentPostgresRepository{db: db}
}

func (r *paymentPostgresRepository) FindAll(params pagination.Params, tutorID *uuid.UUID) ([]entity.Payment, pagination.Meta, error) {
	// whitelist sort column: it is interpolated into ORDER BY
	if !paymentSortColumns[params.Sort] {
		params.Sort = ""
	}

	q := r.db.Preload("Tutorial")
	if tutorID != nil {
		q = q.Where("tutorial_id IN (?)", r.db.Table("tutorials").Select("id").Where("created_by = ?", *tutorID))
	}

	var items []entity.Payment
	if _, meta, err := params.ApplyFiltered(q, &items, paymentSortColumns); err != nil {
		return nil, pagination.Meta{}, err
	} else {
		return items, meta, nil
	}
}

func (r *paymentPostgresRepository) FindByID(id string) (*entity.Payment, error) {
	var payment entity.Payment
	if err := r.db.Preload("Tutorial").Where("id = ?", id).First(&payment).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentPostgresRepository) Create(payment *entity.Payment) error {
	return r.db.Create(payment).Error
}

func (r *paymentPostgresRepository) Update(payment *entity.Payment) error {
	return r.db.Omit(clause.Associations).Save(payment).Error
}

func (r *paymentPostgresRepository) Delete(payment *entity.Payment) error {
	return r.db.Delete(payment).Error
}
