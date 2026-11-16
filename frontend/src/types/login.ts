import z from "zod";

export const loginRequestSchema = z.object({
	email: z.email("Enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

import type { User } from "@/types/user";

/** Answer of the Google login: a normal login, or a request to finish registering. */
export type GoogleLoginResponse = {
	needs_registration: boolean;
	registration_token?: string;
	email?: string;
	name?: string;
	token?: string;
	user?: User;
};

export type LoginResponse = {
	token: string;
	user: User;
};
