import z from "zod";

export const registerRequestSchema = z
	.object({
		name: z.string().min(1, "Name is required").max(100),
		school: z.string().min(1, "School is required").max(100),
		phone: z
			.string()
			.min(1, "Phone is required")
			.max(12, "Phone must be at most 12 digits")
			.regex(/^\d+$/, "Phone must contain digits only"),
		email: z.email("Invalid email address").max(100),
		username: z
			.string()
			.min(3, "Username must be at least 3 characters")
			.max(50),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirm_password: z.string().min(1, "Please confirm your password"),
	})
	.refine((d) => d.password === d.confirm_password, {
		path: ["confirm_password"],
		message: "Passwords do not match",
	});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
