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
	created_at: string;
};

export type ValidateAction = "accept" | "decline";
