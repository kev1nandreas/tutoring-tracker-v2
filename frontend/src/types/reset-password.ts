import z from "zod";

export const resetPasswordRequestSchema = z
	.object({
		new_password: z.string().min(8, "Password must be at least 8 characters"),
		confirm_new_password: z.string().min(1, "Please confirm your new password"),
	})
	.refine((data) => data.new_password === data.confirm_new_password, {
		message: "Passwords do not match",
		path: ["confirm_new_password"],
	});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
