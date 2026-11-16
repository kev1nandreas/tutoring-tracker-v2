import z from "zod";

export const loginRequestSchema = z.object({
	email: z.email("Enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

import type { User } from "@/types/user";

export type LoginResponse = {
	token: string;
	user: User;
};
