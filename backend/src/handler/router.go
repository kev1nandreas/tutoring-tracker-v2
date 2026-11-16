package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kev1nandreas/go-rest-api-template/config"
	"github.com/kev1nandreas/go-rest-api-template/src/factory"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
	"golang.org/x/time/rate"

	docs "github.com/kev1nandreas/go-rest-api-template/docs"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Handlers groups every module handler wired into the router.
type Handlers struct {
	Role              *RoleHandler
	User              *UserHandler
	Tutorial          *TutorialHandler
	Meeting           *MeetingHandler
	Attachment        *AttachmentHandler
	Payment           *PaymentHandler
	PendingValidation *PendingValidationHandler
	Submission        *SubmissionHandler
	Notification      *NotificationHandler
	Job               *JobHandler
	Dashboard         *DashboardHandler
}

func NewRouter(
	logger *zap.Logger,
	mongoCollection *mongo.Collection,
	h *Handlers,
) *gin.Engine {
	isLogging := config.GetEnvBool("APP_MONGO_LOGGING", false)

	r := gin.Default()

	if isLogging {
		logger.Info("MongoDB logging is enabled")
		r.Use(factory.Logger(logger, mongoCollection))
	} else {
		logger.Info("MongoDB logging is disabled")
		r.Use(gin.Logger())
	}

	if gin.Mode() == gin.ReleaseMode {
		r.Use(factory.Security())
		r.Use(factory.Xss())
	}
	r.Use(factory.Cors())

	docs.SwaggerInfo.BasePath = "/api/v1"
	v1 := r.Group("/api/v1")
	{
		v1.GET("/", Healthcheck)

		// 60 requests per minute: per IP on the public routes, per user once signed in
		limit := factory.RateLimiter(rate.Every(time.Minute/60), 60)

		v1.POST("/login", limit, h.User.LoginHandler)
		v1.POST("/register", limit, h.User.RegisterHandler)
		v1.GET("/me", factory.JWTAuth(), limit, h.User.MeHandler)

		// everything below requires a valid JWT
		protected := v1.Group("")
		protected.Use(factory.JWTAuth(), limit)
		protected.POST("/register/tutor", h.User.RegisterTutorHandler)

		protected.GET("/dashboard/tutor", h.Dashboard.TutorDashboard)
		protected.GET("/dashboard/student", h.Dashboard.StudentDashboard)

		protected.GET("/roles", h.Role.FindRoles)
		protected.POST("/roles", h.Role.CreateRole)
		protected.GET("/roles/:id", h.Role.FindRole)
		protected.PUT("/roles/:id", h.Role.UpdateRole)
		protected.DELETE("/roles/:id", h.Role.DeleteRole)

		protected.GET("/users", h.User.FindUsers)
		protected.GET("/users/:id", h.User.FindUser)
		protected.PUT("/users/:id", h.User.UpdateUser)
		protected.DELETE("/users/:id", h.User.DeleteUser)

		protected.GET("/me/tutorials", h.Tutorial.FindMyTutorials)
		protected.GET("/me/tutorials/:id", h.Tutorial.FindMyTutorial)
		protected.GET("/me/tutorials/:id/meetings", h.Meeting.FindMyTutorialMeetings)
		protected.GET("/tutorials", h.Tutorial.FindTutorials)
		protected.POST("/tutorials", h.Tutorial.CreateTutorial)
		protected.GET("/tutorials/:id", h.Tutorial.FindTutorial)
		protected.GET("/tutorials/:id/meetings", h.Meeting.FindMeetingsByTutorial)
		protected.GET("/pending-validations", h.PendingValidation.FindPendingValidations)
		protected.GET("/tutorials/:id/pending-validations", h.PendingValidation.FindPendingValidationsByTutorial)
		protected.GET("/pending-validations/mine", h.PendingValidation.FindMyEnrollments)
		protected.POST("/pending-validations/enroll", h.PendingValidation.Enroll)
		protected.POST("/pending-validations/validate", h.PendingValidation.Validate)
		protected.PUT("/tutorials/:id", h.Tutorial.UpdateTutorial)
		protected.DELETE("/tutorials/:id", h.Tutorial.DeleteTutorial)

		protected.GET("/meetings", h.Meeting.FindMeetings)
		protected.POST("/meetings", h.Meeting.CreateMeeting)
		protected.GET("/meetings/:id", h.Meeting.FindMeeting)
		protected.GET("/meetings/:id/attachments", h.Attachment.FindAttachmentsByMeeting)
		protected.POST("/meetings/:id/attachments/upload-url", h.Attachment.CreateUploadTicket)
		protected.POST("/meetings/:id/attachments/complete", h.Attachment.CompleteUploads)
		protected.GET("/attachments/:id/download", h.Attachment.DownloadAttachment)
		protected.DELETE("/attachments/:id", h.Attachment.DeleteAttachment)
		protected.GET("/meetings/:id/submissions", h.Submission.FindSubmissionsByMeeting)
		protected.POST("/meetings/:id/submissions", h.Submission.CreateSubmission)
		protected.PUT("/submissions/:id/grade", h.Submission.GradeSubmission)
		protected.DELETE("/submissions/:id", h.Submission.DeleteSubmission)
		protected.PUT("/meetings/:id", h.Meeting.UpdateMeeting)
		protected.DELETE("/meetings/:id", h.Meeting.DeleteMeeting)

		protected.GET("/payments", h.Payment.FindPayments)
		protected.POST("/payments", h.Payment.CreatePayment)
		protected.GET("/payments/:id", h.Payment.FindPayment)
		protected.PUT("/payments/:id", h.Payment.UpdatePayment)
		protected.DELETE("/payments/:id", h.Payment.DeletePayment)

		protected.GET("/users/:id/notifications", h.Notification.FindNotificationsByUser)
		protected.GET("/notifications/:id", h.Notification.FindNotification)
		protected.PATCH("/notifications/:id/read", h.Notification.MarkNotificationAsRead)

		protected.GET("/jobs", h.Job.FindJobs)
		protected.GET("/jobs/:id", h.Job.FindJob)
	}
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	return r
}
