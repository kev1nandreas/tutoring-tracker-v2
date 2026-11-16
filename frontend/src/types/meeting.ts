export type Meeting = {
	id: string;
	tutorial_id: string;
	title: string;
	/** ISO timestamp; the first 10 characters are the date. */
	date: string;
	youtube_link: string;
	/** ISO timestamp; read the wall time with `timeOf`. */
	time_start: string;
	time_end: string;
	is_done: boolean;
	marks: string;
	has_homework: boolean;
	text_homework: string;
	created_at: string;
	updated_at: string;
};
