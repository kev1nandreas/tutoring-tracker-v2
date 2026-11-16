export const MAIN_ENDPOINT = {
	User: {
		Me: "/v1/me",
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
