package factory

import (
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/repository"
	"github.com/kev1nandreas/go-rest-api-template/src/modules/payment/usecase"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/incomesync"
	"gorm.io/gorm"
)

func NewPaymentUsecase(db *gorm.DB, income incomesync.Syncer) usecase.PaymentUsecase {
	repo := repository.NewPaymentPostgresRepository(db)
	return usecase.NewPaymentUsecase(repo, income)
}
