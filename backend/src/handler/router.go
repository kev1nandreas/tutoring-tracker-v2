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
	Bundle            *BundleHandler
	Attendance        *AttendanceHandler
	Admin             *AdminHandler
	Feedback          *FeedbackHandler
	Student           *StudentHandler
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
		v1.POST("/login/google", limit, h.User.GoogleLoginHandler)
		v1.POST("/register/google", limit, h.User.GoogleRegisterHandler)
		v1.POST("/auth/forgot-password", limit, h.User.ForgotPasswordHandler)
		v1.POST("/auth/reset-password", limit, h.User.ResetPasswordHandler)
		v1.POST("/register", limit, h.User.RegisterHandler)
		v1.GET("/me", factory.JWTAuth(), limit, h.User.MeHandler)
		v1.PUT("/me/profile", factory.JWTAuth(), limit, h.User.CompleteProfileHandler)
		v1.POST("/me/email/verification", factory.JWTAuth(), limit, h.User.SendVerificationEmailHandler)
		v1.PUT("/me/email-notifications", factory.JWTAuth(), limit, h.User.EmailNotificationsHandler)
		v1.POST("/auth/verify-email", limit, h.User.VerifyEmailHandler)

		// public feedback form (no login): per-IP rate limit
		v1.GET("/public/feedback/:code", limit, h.Feedback.FormInfo)
		v1.POST("/public/feedback/:code", limit, h.Feedback.Submit)

		// opened by the browser from a signed link, so it takes a token instead of a login
		v1.GET("/bundles/:id/download", limit, h.Bundle.DownloadBundle)

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

		protected.GET("/students", h.Student.FindStudents)
		protected.GET("/students/:id", h.Student.FindStudent)
		// raw user records: admins only
		protected.GET("/users", h.Admin.RequireAdmin(), h.User.FindUsers)
		protected.GET("/users/:id", h.Admin.RequireAdmin(), h.User.FindUser)
		protected.PUT("/users/:id", h.Admin.RequireAdmin(), h.User.UpdateUser)
		protected.DELETE("/users/:id", h.Admin.RequireAdmin(), h.Admin.DeleteUser)

		protected.GET("/admin/users", h.Admin.ListUsers)
		protected.DELETE("/admin/users/:id", h.Admin.DeleteUser)

		protected.GET("/me/tutorials", h.Tutorial.FindMyTutorials)
		protected.GET("/me/tutorials/:id", h.Tutorial.FindMyTutorial)
		protected.POST("/me/tutorials/:id/bundle", h.Feedback.Gate(), h.Bundle.RequestBundle)
		protected.GET("/me/bundles/:id", h.Bundle.BundleStatus)
		protected.GET("/me/tutorials/:id/meetings", h.Feedback.Gate(), h.Meeting.FindMyTutorialMeetings)
		protected.GET("/me/tutorials/:id/feedback-status", h.Feedback.Status)
		protected.GET("/tutorials/:id/feedback", h.Feedback.Summary)
		protected.GET("/tutorials", h.Tutorial.FindTutorials)
		protected.POST("/tutorials", h.Tutorial.CreateTutorial)
		protected.GET("/tutorials/:id", h.Tutorial.FindTutorial)
		protected.GET("/tutorials/:id/meetings", h.Meeting.FindMeetingsByTutorial)
		protected.POST("/tutorials/:id/bundle", h.Bundle.RequestTutorBundle)
		protected.POST("/tutorials/:id/meetings/import", h.Meeting.ImportSchedule)
		protected.GET("/schedule-import/template", h.Meeting.ScheduleTemplate)
		protected.GET("/pending-validations", h.PendingValidation.FindPendingValidations)
		protected.GET("/pending-validations/count", h.PendingValidation.CountPendingValidations)
		protected.GET("/tutorials/:id/pending-validations", h.PendingValidation.FindPendingValidationsByTutorial)
		protected.GET("/pending-validations/mine", h.PendingValidation.FindMyEnrollments)
		protected.POST("/pending-validations/enroll", h.PendingValidation.Enroll)
		protected.POST("/pending-validations/validate", h.PendingValidation.Validate)
		protected.DELETE("/tutorials/:id/students/:userId", h.PendingValidation.Unenroll)
		protected.PUT("/tutorials/:id", h.Tutorial.UpdateTutorial)
		protected.DELETE("/tutorials/:id", h.Tutorial.DeleteTutorial)

		protected.GET("/meetings", h.Meeting.FindMeetings)
		protected.POST("/meetings", h.Meeting.CreateMeeting)
		protected.GET("/meetings/:id", h.Meeting.FindMeeting)
		protected.GET("/meetings/:id/attachments", h.Attachment.FindAttachmentsByMeeting)
		protected.POST("/meetings/:id/attachments/upload-url", h.Attachment.CreateUploadTicket)
		protected.POST("/meetings/:id/attachments/complete", h.Attachment.CompleteUploads)
		protected.GET("/attachments/:id/download", h.Attachment.DownloadAttachment)

		// attendance by photo (only when the tutorial's attendance switch is on)
		protected.GET("/meetings/:id/attendance", h.Attendance.Roster)
		protected.GET("/meetings/:id/attendance/me", h.Attendance.MyAttendance)
		protected.POST("/meetings/:id/attendance", h.Attendance.MarkAttendance)
		protected.POST("/meetings/:id/attendance/upload-url", h.Attendance.CreateUploadTicket)
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
