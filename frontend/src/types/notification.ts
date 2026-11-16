export type Notification = {
	id: string;
	user_id: string;
	/** e.g. "material", "download" */
	type: string;
	header: string;
	body: string;
	is_read: boolean;
	created_at: string;
	updated_at: string;
};
