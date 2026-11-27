import type { Role } from "@/types/user";

/** A registered user as the admin sees it (GET /admin/users). */
export type AdminUserRow = {
	id: string;
	name: string;
	username: string;
	email: string;
	school: string;
	phone: string;
	role: Role;
	/** Tutorials a tutor created, or the ones a student was accepted into. */
	tutorial_count: number;
	/** ISO time of the last login; null if they never logged in. */
	last_login_at: string | null;
	created_at: string;
};

/** One tutorial in a user's detail: created by the tutor, or asked to join by the student. */
export type AdminUserTutorial = {
	tutorial_id: string;
	custom_id: string;
	name: string;
	is_done: boolean;
	/** Who runs it (a student's tutorials). */
	tutor_name: string;
	/** The student's request; empty for a tutor's own tutorial. */
	status: "" | "pending" | "accepted" | "declined";
	/** Accepted students (a tutor's own tutorials). */
	student_count: number;
};

export type AdminUserDetail = AdminUserRow & {
	email_verified: boolean;
	has_password: boolean;
	tutorials: AdminUserTutorial[];
};
