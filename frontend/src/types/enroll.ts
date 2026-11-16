import z from "zod";

/** Tutorial codes are 6 letters or digits. */
export const enrollSchema = z.object({
	tutorial_code: z
		.string()
		.trim()
		.regex(/^[A-Za-z0-9]{6}$/, "A class code has 6 letters or numbers")
		.transform((v) => v.toUpperCase()),
});

export type EnrollFormValues = z.input<typeof enrollSchema>;
export type EnrollRequest = z.output<typeof enrollSchema>;

export type EnrollmentStatus = "pending" | "accepted" | "declined";

/** One of the student's own enrollment requests (GET /pending-validations/mine). */
export type MyEnrollment = {
	id: string;
	status: EnrollmentStatus;
	tutorial: {
		name: string;
		custom_id: string;
		description: string;
		/** YYYY-MM-DD */
		date_started: string;
		date_ended: string;
		is_done: boolean;
	};
	requested_at: string;
	/** When the status last changed (or the request was last sent). */
	updated_at: string;
};
