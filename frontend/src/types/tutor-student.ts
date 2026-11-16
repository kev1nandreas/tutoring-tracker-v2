/** A student of the tutor: a user accepted into at least one of the tutor's tutorials. */
export type StudentRow = {
	id: string;
	name: string;
	username: string;
	email: string;
	school: string;
	phone: string;
	tutorial_count: number;
	/** ISO time of the last login; null if they never logged in. */
	last_login_at: string | null;
};

export type StudentTutorial = {
	tutorial_id: string;
	custom_id: string;
	name: string;
	is_done: boolean;
	status: "pending" | "accepted" | "declined";
	total_meetings: number;
	attended: number;
	submitted: number;
	/** Mean of the graded homework (0-100); null when nothing is graded. */
	avg_grade: number | null;
};

export type StudentDetail = StudentRow & { tutorials: StudentTutorial[] };
