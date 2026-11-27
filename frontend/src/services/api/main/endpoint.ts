export const MAIN_ENDPOINT = {
	User: {
		Me: "/v1/me",
		Profile: "/v1/me/profile",
		SendVerification: "/v1/me/email/verification",
		EmailNotifications: "/v1/me/email-notifications",
	},
	Tutorial: {
		List: "/v1/tutorials",
		Detail: (id: string) => `/v1/tutorials/${id}`,
		Meetings: (id: string) => `/v1/tutorials/${id}/meetings`,
		Students: (id: string) => `/v1/tutorials/${id}/pending-validations`,
		Student: (id: string, userId: string) =>
			`/v1/tutorials/${id}/students/${userId}`,
		ImportSchedule: (id: string) => `/v1/tutorials/${id}/meetings/import`,
	},
	Student: {
		List: "/v1/students",
		Detail: (id: string) => `/v1/students/${id}`,
	},
	Payment: {
		List: "/v1/payments",
		Detail: (id: string) => `/v1/payments/${id}`,
	},
	Feedback: {
		Form: (code: string) => `/v1/public/feedback/${code}`,
		Status: (tutorialId: string) =>
			`/v1/me/tutorials/${tutorialId}/feedback-status`,
		Summary: (tutorialId: string) => `/v1/tutorials/${tutorialId}/feedback`,
	},
	Attachment: {
		List: (meetingId: string) => `/v1/meetings/${meetingId}/attachments`,
		UploadUrl: (meetingId: string) =>
			`/v1/meetings/${meetingId}/attachments/upload-url`,
		Complete: (meetingId: string) =>
			`/v1/meetings/${meetingId}/attachments/complete`,
		Download: (id: string) => `/v1/attachments/${id}/download`,
		Detail: (id: string) => `/v1/attachments/${id}`,
	},
	Attendance: {
		Roster: (meetingId: string) => `/v1/meetings/${meetingId}/attendance`,
		Mine: (meetingId: string) => `/v1/meetings/${meetingId}/attendance/me`,
		UploadUrl: (meetingId: string) =>
			`/v1/meetings/${meetingId}/attendance/upload-url`,
	},
	Bundle: {
		Request: (tutorialId: string) => `/v1/me/tutorials/${tutorialId}/bundle`,
		TutorRequest: (tutorialId: string) => `/v1/tutorials/${tutorialId}/bundle`,
		Status: (id: string) => `/v1/me/bundles/${id}`,
	},
	Me: {
		Tutorials: "/v1/me/tutorials",
		Tutorial: (id: string) => `/v1/me/tutorials/${id}`,
		TutorialMeetings: (id: string) => `/v1/me/tutorials/${id}/meetings`,
	},
	Enrollment: {
		List: "/v1/pending-validations",
		Enroll: "/v1/pending-validations/enroll",
		Mine: "/v1/pending-validations/mine",
		Count: "/v1/pending-validations/count",
		Validate: "/v1/pending-validations/validate",
	},
	Submission: {
		Grade: (id: string) => `/v1/submissions/${id}/grade`,
	},
	Meeting: {
		Create: "/v1/meetings",
		ImportTemplate: "/v1/schedule-import/template",
		Detail: (id: string) => `/v1/meetings/${id}`,
		Submissions: (id: string) => `/v1/meetings/${id}/submissions`,
	},
	Dashboard: {
		Tutor: "/v1/dashboard/tutor",
		Student: "/v1/dashboard/student",
	},
	Notification: {
		ByUser: (userId: string) => `/v1/users/${userId}/notifications`,
		Read: (id: string) => `/v1/notifications/${id}/read`,
	},
	Admin: {
		Users: "/v1/admin/users",
		User: (id: string) => `/v1/admin/users/${id}`,
	},
	Auth: {
		Login: "/v1/login",
		Google: "/v1/login/google",
		RegisterGoogle: "/v1/register/google",
		VerifyEmail: "/v1/auth/verify-email",
		Register: "/v1/register",
		RegisterTutor: "/v1/register/tutor",
		// Not implemented by the backend yet (used by the template pages).
		RefreshToken: "/v1/auth/refresh-token",
		ForgotPassword: "/v1/auth/forgot-password",
		ResetPassword: "/v1/auth/reset-password",
	},
} as const;
