import z from "zod";

export type SubmissionUser = {
	id: string;
	name: string;
	username: string;
	school: string;
};

export type Submission = {
	id: string;
	meeting_id: string;
	user_id: string;
	user?: SubmissionUser;
	answer: string;
	/** Links to the student's files, separated by commas, spaces or new lines. */
	files: string;
	/** 0-100, null until graded. */
	grade: number | null;
	feedback: string;
	graded_at: string | null;
	created_at: string;
	updated_at: string;
};

/** Grade is typed as text in the form, then checked and sent as a number. */
export const gradeFormSchema = z.object({
	grade: z
		.string()
		.min(1, "Enter a grade")
		.refine(
			(v) => /^\d{1,3}$/.test(v) && Number(v) <= 100,
			"Enter a whole number from 0 to 100",
		),
	feedback: z.string().max(500, "At most 500 characters"),
});

export type GradeFormValues = z.infer<typeof gradeFormSchema>;

/** Split the free-text `files` field into links. */
export const fileLinks = (files: string) =>
	files.split(/[\s,]+/).filter(Boolean);
