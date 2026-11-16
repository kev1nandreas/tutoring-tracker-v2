export type Role = "admin" | "tutor" | "student";

export type User = {
	id: string;
	role_id: string;
	school?: string;
	phone?: string;
	last_login_at?: string | null;
	created_at?: string;
	name: string;
	username: string;
	email: string;
	role: Role;
	/** false for a Google sign-up that has not given its school and phone yet. */
	profile_complete?: boolean;
};

export type WithToken = {
	access_token: string;
	refresh_token?: string;
};
