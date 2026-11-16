import z from "zod";

export type Tutorial = {
	id: string;
	custom_id: string;
	name: string;
	/** ISO timestamp from the API; use the first 10 chars for the date. */
	date_started: string;
	date_ended: string;
	meeting_days: number;
	is_done: boolean;
	description: string;
	show_download: boolean;
	show_attendance: boolean;
	show_feedback: boolean;
	created_at: string;
	updated_at: string;
};

export const createTutorialSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required").max(100),
		date_started: z.string().min(1, "Start date is required"),
		date_ended: z.string().min(1, "End date is required"),
		description: z.string().max(255, "At most 255 characters"),
		is_done: z.boolean(),
		show_download: z.boolean(),
		show_attendance: z.boolean(),
		show_feedback: z.boolean(),
	})
	.refine(
		(d) => !d.date_started || !d.date_ended || d.date_ended >= d.date_started,
		{
			path: ["date_ended"],
			message: "End date must not be before the start date",
		},
	);

export type CreateTutorialRequest = z.infer<typeof createTutorialSchema>;

export type TutorialStatus = "all" | "active" | "done";
