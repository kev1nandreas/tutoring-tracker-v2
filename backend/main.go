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
	attendanceFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/attendance/factory"
	bundleFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/factory"
	bundleUsecase "github.com/kev1nandreas/go-rest-api-template/src/modules/bundle/usecase"
	dashboardFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/dashboard/factory"
	feedbackFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/feedback/factory"
	jobFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/job/factory"
	meetingFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/meeting/factory"
	notificationFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/notification/factory"
	notificationUC "github.com/kev1nandreas/go-rest-api-template/src/modules/notification/usecase"
	paymentFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/payment/factory"
	pendingValidationFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/pending_validation/factory"
	roleFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/role/factory"
	studentFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/student/factory"
	submissionFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/submission/factory"
	tutorialFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/tutorial/factory"
	userFactory "github.com/kev1nandreas/go-rest-api-template/src/modules/user/factory"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/incomesync"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/mailer"
	"github.com/kev1nandreas/go-rest-api-template/src/shared/notifier"
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

	// Notifications: one usecase shared by the handler and the event notifier.
	// Email copies are sent only when SMTP is configured (see SMTP_* in .env.example).
	var mail notificationUC.Mailer
	if m := mailer.New(mailer.Config{
		Host:     config.GetEnvString("SMTP_HOST", ""),
		Port:     config.GetEnvInt("SMTP_PORT", 587),
		Username: config.GetEnvString("SMTP_USERNAME", ""),
		Password: config.GetEnvString("SMTP_PASSWORD", ""),
		From:     config.GetEnvString("SMTP_FROM", ""),
		FromName: config.GetEnvString("SMTP_FROM_NAME", "Tutoring Tracker"),
	}); m != nil {
		mail = m
	} else {
		log.Println("SMTP not configured: notifications are in-app only")
	}
	notificationUsecase := notificationFactory.NewNotificationUsecase(notificationCollection, db, mail)
	if _, err := rabbitmq.DeclareQueue(notifier.QueueMaterial); err != nil {
		log.Fatalf("failed to declare queue %s: %v", notifier.QueueMaterial, err)
	}
	eventNotifier := notifier.NewNotifier(rabbitmq)

	// Background worker: consumes notification jobs and fans them out to students.
	workerCtx, stopWorker := context.WithCancel(ctx)
	defer stopWorker()
	go func() {
		if err := notifier.NewWorker(db, rabbitmq, notificationUsecase).Run(workerCtx); err != nil {
			log.Printf("notification worker stopped: %v", err)
		}
	}()

	// Download packages: a queue job checks each request, and the student is notified.
	if _, err := rabbitmq.DeclareQueue(bundleUsecase.QueueBundle); err != nil {
		log.Fatalf("failed to declare queue %s: %v", bundleUsecase.QueueBundle, err)
	}
	bundleService := bundleFactory.NewBundleUsecase(db, storage, rabbitmq, notificationUsecase)
	go func() {
		if err := bundleUsecase.NewWorker(bundleService, rabbitmq).Run(workerCtx); err != nil {
			log.Printf("bundle worker stopped: %v", err)
		}
	}()

	// Initialize module usecases and handlers via factories
	handlers := &handler.Handlers{
		Role:       handler.NewRoleHandler(roleFactory.NewRoleUsecase(db)),
		User:       handler.NewUserHandler(userFactory.NewUserUsecase(db)),
		Tutorial:   handler.NewTutorialHandler(tutorialFactory.NewTutorialUsecase(db, storage)),
		Meeting:    handler.NewMeetingHandler(meetingFactory.NewMeetingUsecase(db, storage)),
		Attachment: handler.NewAttachmentHandler(attachmentFactory.NewAttachmentUsecase(db, eventNotifier, storage)),
		Payment: handler.NewPaymentHandler(paymentFactory.NewPaymentUsecase(db, incomesync.New(
			config.GetEnvString("PERSONAL_WEBSITE_URL", ""),
			config.GetEnvString("PERSONAL_WEBSITE_API_KEY", ""),
		))),
		PendingValidation: handler.NewPendingValidationHandler(pendingValidationFactory.NewPendingValidationUsecase(db)),
		Submission:        handler.NewSubmissionHandler(submissionFactory.NewSubmissionUsecase(db)),
		Notification:      handler.NewNotificationHandler(notificationUsecase),
		Job:               handler.NewJobHandler(jobFactory.NewJobUsecase(db)),
		Dashboard:         handler.NewDashboardHandler(dashboardFactory.NewDashboardUsecase(db)),
		Bundle:            handler.NewBundleHandler(bundleService),
		Student:           handler.NewStudentHandler(studentFactory.NewStudentUsecase(db)),
		Feedback:          handler.NewFeedbackHandler(feedbackFactory.NewFeedbackUsecase(db)),
		Attendance:        handler.NewAttendanceHandler(attendanceFactory.NewAttendanceUsecase(db, storage)),
	}

	// Setup router
	r := handler.NewRouter(logger, mongoCollection, handlers)

	if err := r.Run(":" + strconv.Itoa(appPort)); err != nil {
		log.Fatal(err)
	}
}
