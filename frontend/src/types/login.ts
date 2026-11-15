import z from "zod";

export const loginRequestSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type LoginResponse = {
	access_token: string;
	refresh_token: string;
	user: {
		id: string;
		name: string;
		role?: string;
		permissions?: string[];
	};
};

export type AccountLockedErrorData = {
	retry_after: number;
};

export type RefreshTokenRequest = {
	refresh_token: string;
};

export type RefreshTokenResponse = {
	access_token: string;
	refresh_token: string;
};
