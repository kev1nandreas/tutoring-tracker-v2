package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/usecase"
	"gorm.io/gorm"
)

func NewPaymentUsecase(db *gorm.DB) usecase.PaymentUsecase {
	repo := repository.NewPaymentPostgresRepository(db)
	return usecase.NewPaymentUsecase(repo)
}
