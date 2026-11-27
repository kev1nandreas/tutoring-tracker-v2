import z from "zod";

export const profileSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
	email: z.email("Invalid email address").max(100),
	school: z.string().trim().min(1, "School is required").max(100),
	phone: z
		.string()
		.min(1, "Phone is required")
		.max(13, "Phone must be at most 13 digits")
		.regex(/^\d+$/, "Phone must contain digits only"),
	username: z
		.string()
		.trim()
		.min(3, "Username must be at least 3 characters")
		.max(50),
});

export type ProfileValues = z.infer<typeof profileSchema>;

/** Set or change the password. The current one is checked only when the account has one. */
export const passwordSchema = (hasPassword: boolean) =>
	z
		.object({
			current_password: hasPassword
				? z.string().min(1, "Enter your current password")
				: z.string(),
			new_password: z.string().min(8, "Password must be at least 8 characters"),
			confirm_password: z.string().min(1, "Please confirm your password"),
		})
		.refine((d) => d.new_password === d.confirm_password, {
			path: ["confirm_password"],
			message: "Passwords do not match",
		});

export type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>;
