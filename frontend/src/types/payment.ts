import z from "zod";

export type Payment = {
	id: string;
	tutorial_id: string;
	tutorial?: { name: string; date_started: string; date_ended: string };
	user_id?: string | null;
	student_name?: string;
	nominal: number;
	is_paid: boolean;
	/** Unix seconds; 0 when no date was set. */
	payment_date: number;
	note: string;
	created_at: string;
	updated_at: string;
};

export type PaymentRequest = {
	tutorial_id: string;
	nominal: number;
	is_paid: boolean;
	payment_date: number;
	note: string;
};

export type PaymentFilter = "all" | "paid" | "unpaid";

export const paymentFormSchema = z.object({
	tutorial_id: z.string().min(1, "Choose a tutorial"),
	nominal: z
		.string()
		.regex(/^[1-9]\d*$/, "Enter a whole amount above 0, digits only"),
	payment_date: z.string(),
	is_paid: z.boolean(),
	note: z.string().max(100, "At most 100 characters"),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

/** "2026-11-20" -> unix seconds at local midnight; "" -> 0. */
export const dateToUnix = (date: string) =>
	date ? Math.floor(new Date(`${date}T00:00:00`).getTime() / 1000) : 0;

/** Unix seconds -> "YYYY-MM-DD" (local); 0 -> "". */
export const unixToDate = (unix: number) =>
	unix > 0 ? new Date(unix * 1000).toLocaleDateString("en-CA") : "";
