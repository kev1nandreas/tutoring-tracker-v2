/** Enrollment state of a student in a tutorial (pending_validations.is_validated). */
export type StudentStatus = "accepted" | "pending" | "declined";

export const STUDENT_STATUS_CODE: Record<StudentStatus, number> = {
	pending: 0,
	accepted: 1,
	declined: 2,
};

export type TutorialStudent = {
	id: string;
	user_id: string;
	name: string;
	username: string;
	school: string;
	/** ISO time of the last login; null if they never logged in. */
	last_login_at: string | null;
	created_at: string;
};

export type ValidateAction = "accept" | "decline";

/** One tutorial with its enrollment requests (GET /pending-validations). */
export type ValidationGroup = {
	tutorial: { name: string; custom_id: string };
	pending_validations: TutorialStudent[];
};
