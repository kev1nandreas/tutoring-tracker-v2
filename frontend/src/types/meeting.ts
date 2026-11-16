export type Meeting = {
	id: string;
	tutorial_id: string;
	title: string;
	/** ISO timestamp; the first 10 characters are the date. */
	date: string;
	youtube_link: string;
	/** ISO timestamp; read the wall time with `timeOf`. */
	time_start: string;
	time_end: string;
	is_done: boolean;
	marks: string;
	has_homework: boolean;
	text_homework: string;
	created_at: string;
	updated_at: string;
};

import z from "zod";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const meetingFormSchema = z
	.object({
		title: z.string().trim().min(1, "Title is required").max(100),
		date: z.string().min(1, "Date is required"),
		time_start: z.string().regex(HHMM, "Start time is required"),
		time_end: z.string().regex(HHMM, "End time is required"),
		youtube_link: z
			.string()
			.max(100, "At most 100 characters")
			.refine(
				(v) => v === "" || /^https?:\/\/\S+$/.test(v),
				"Enter a full link, starting with https://",
			),
		marks: z.string().max(255, "At most 255 characters"),
		has_homework: z.boolean(),
		text_homework: z.string().max(255, "At most 255 characters"),
		is_done: z.boolean(),
	})
	.refine(
		(d) =>
			!HHMM.test(d.time_start) ||
			!HHMM.test(d.time_end) ||
			d.time_end > d.time_start,
		{
			path: ["time_end"],
			message: "End time must be after the start time",
		},
	);

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;
