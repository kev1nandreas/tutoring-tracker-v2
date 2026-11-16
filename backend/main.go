package main

import (
	"context"
	"log"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/factory"
	"github.com/kev1nandreas/go-rest-api-template/src/handler"
	attachmentFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/attachment/factory"
	jobFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/job/factory"
	meetingFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/factory"
	notificationFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/notification/factory"
	paymentFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/payment/factory"
	pendingValidationFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/factory"
	roleFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/role/factory"
	submissionFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/submission/factory"
	tutorialFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/factory"
	userFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/user/factory"
	"go.mongodb.org/mongo-driver/mongo"

	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
)

// @title           Swagger Example API
// @version         1.0
// @description     This is a sample server celler server.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8082
// @BasePath  /api/v1

// @securityDefinitions.apikey JwtAuth
// @in header
// @name Authorization

// @externalDocs.description  OpenAPI
// @externalDocs.url          https://swagger.io/resources/open-api/
func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading .env file")
	}

	appPort := config.GetEnvInt("APP_PORT", 8082)
	isLogging := config.GetEnvBool("APP_MONGO_LOGGING", false)
	isDebugging := config.GetEnvBool("APP_DEBUG", false)

	if isDebugging {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize infrastructure
	redisClient := factory.NewRedisClient()
	// redisClient is ready to inject into module factories/handlers.
	_ = redisClient
	db := factory.NewDatabase()

	var mongoCollection *mongo.Collection
	if isLogging {
		mongoCollection = factory.NewMongoDB()
	}

	// Notifications live in MongoDB (separate collection from logging).
	notificationCollection := factory.NewMongoCollection(config.GetEnvString("MONGO_NOTIFICATION_COLLECTION", "notifications"))

	ctx := context.Background()

	storage, err := factory.NewStorage(ctx)
	if err != nil {
		log.Fatalf("failed to init storage: %v", err)
	}
	rabbitmq, err := factory.NewRabbitMQ()
	if err != nil {
		log.Fatalf("failed to init rabbitmq: %v", err)
	}
	defer rabbitmq.Close()
	// storage and rabbitmq are ready to inject into module factories/handlers.
	_ = storage

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize module usecases and handlers via factories
	handlers := &handler.Handlers{
		Role:              handler.NewRoleHandler(roleFactory.NewRoleUsecase(db)),
		User:              handler.NewUserHandler(userFactory.NewUserUsecase(db)),
		Tutorial:          handler.NewTutorialHandler(tutorialFactory.NewTutorialUsecase(db)),
		Meeting:           handler.NewMeetingHandler(meetingFactory.NewMeetingUsecase(db)),
		Attachment:        handler.NewAttachmentHandler(attachmentFactory.NewAttachmentUsecase(db)),
		Payment:           handler.NewPaymentHandler(paymentFactory.NewPaymentUsecase(db)),
		PendingValidation: handler.NewPendingValidationHandler(pendingValidationFactory.NewPendingValidationUsecase(db)),
		Submission:        handler.NewSubmissionHandler(submissionFactory.NewSubmissionUsecase(db)),
		Notification:      handler.NewNotificationHandler(notificationFactory.NewNotificationUsecase(notificationCollection)),
		Job:               handler.NewJobHandler(jobFactory.NewJobUsecase(db)),
	}

	// Setup router
	r := handler.NewRouter(logger, mongoCollection, handlers)

	if err := r.Run(":" + strconv.Itoa(appPort)); err != nil {
		log.Fatal(err)
	}
}
