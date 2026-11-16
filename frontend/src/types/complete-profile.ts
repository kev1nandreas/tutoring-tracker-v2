import z from "zod";

export const completeProfileSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
	school: z.string().trim().min(1, "School is required").max(100),
	phone: z
		.string()
		.min(1, "Phone is required")
		.max(12, "Phone must be at most 12 digits")
		.regex(/^\d+$/, "Phone must contain digits only"),
	username: z
		.string()
		.trim()
		.min(3, "Username must be at least 3 characters")
		.max(50),
});

export type CompleteProfileRequest = z.infer<typeof completeProfileSchema>;
