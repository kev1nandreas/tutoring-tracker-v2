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
};

export type WithToken = {
	access_token: string;
	refresh_token?: string;
};
