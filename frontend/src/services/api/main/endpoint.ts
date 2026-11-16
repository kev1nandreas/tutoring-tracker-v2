export const MAIN_ENDPOINT = {
	User: {
		Me: "/v1/me",
	},
	Tutorial: {
		List: "/v1/tutorials",
		Detail: (id: string) => `/v1/tutorials/${id}`,
		Meetings: (id: string) => `/v1/tutorials/${id}/meetings`,
		Students: (id: string) => `/v1/tutorials/${id}/pending-validations`,
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
		Validate: "/v1/pending-validations/validate",
	},
	Submission: {
		Grade: (id: string) => `/v1/submissions/${id}/grade`,
	},
	Meeting: {
		Create: "/v1/meetings",
		Detail: (id: string) => `/v1/meetings/${id}`,
		Submissions: (id: string) => `/v1/meetings/${id}/submissions`,
	},
	Dashboard: {
		Tutor: "/v1/dashboard/tutor",
		Student: "/v1/dashboard/student",
	},
	Auth: {
		Login: "/v1/login",
		Register: "/v1/register",
		RegisterTutor: "/v1/register/tutor",
		// Not implemented by the backend yet (used by the template pages).
		RefreshToken: "/v1/auth/refresh-token",
		ForgotPassword: "/v1/auth/forgot-password",
		ResetPassword: "/v1/auth/reset-password",
	},
} as const;
