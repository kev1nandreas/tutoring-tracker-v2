export type User = {
	id: string;
	name: string;
	role?: string;
	permissions?: string[];
};

export type CreateUserRequest = {
	id: string;
	name: string;
	email: string;
	username: string;
	password: string;
	role: string;
};

export type UpdateUserRequest = {
	id?: string;
	name?: string;
	email?: string;
	username?: string;
	password?: string;
	role?: string;
};

export type WithToken = {
	access_token: string;
	refresh_token: string;
};
