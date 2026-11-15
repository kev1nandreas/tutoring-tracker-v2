export const MAIN_ENDPOINT = {
	Auth: {
		Login: "/v1/auth/login",
		RefreshToken: "/v1/auth/refresh-token",
		Logout: "/v1/auth/logout",
		ForgotPassword: "/v1/auth/forgot-password",
		ResetPassword: "/v1/auth/reset-password",
	},
	User: {
		CurrentUser: "/v1/me",
	},
} as const;
