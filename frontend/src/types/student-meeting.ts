/** A meeting as a student sees it (GET /me/tutorials/:id/meetings). */
export type StudentMeeting = {
	id: string;
	tutorial_id: string;
	title: string;
	/** ISO timestamp; the first 10 characters are the date. */
	date: string;
	time_start: string;
	time_end: string;
	is_done: boolean;
	has_homework: boolean;
	text_homework: string;
	/** YouTube video id of the recording, or empty. The raw link is never sent. */
	video_id: string;
};
