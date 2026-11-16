/** A tutorial the student was accepted into (GET /me/tutorials). Dates are YYYY-MM-DD. */
export type EnrolledTutorial = {
	id: string;
	custom_id: string;
	name: string;
	description: string;
	tutor_name: string;
	date_started: string;
	date_ended: string;
	is_done: boolean;
	total_meetings: number;
	done_meetings: number;
	/** Empty when nothing is scheduled. */
	next_meeting_date: string;
	/** The tutor turned on "download everything" for this class. */
	can_download: boolean;
};

export type EnrolledFilter = "all" | "active" | "done";
