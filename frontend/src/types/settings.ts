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
