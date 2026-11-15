import z from "zod";

export const forgotPasswordRequestSchema = z.object({
	email: z.email("Invalid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
