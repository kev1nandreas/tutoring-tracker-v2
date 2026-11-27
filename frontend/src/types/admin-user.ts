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
