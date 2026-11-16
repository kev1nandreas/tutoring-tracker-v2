// Dates are "YYYY-MM-DD", times "HH:MM". Empty string = not set.

export type MeetingItem = {
	id: string;
	title: string;
	date: string;
	time_start: string;
	time_end: string;
	has_homework: boolean;
	tutorial_id: string;
	tutorial_name: string;
};

export type TutorialItem = {
	id: string;
	custom_id: string;
	name: string;
	description: string;
	date_started: string;
	date_ended: string;
	total_meetings: number;
	done_meetings: number;
	/** Tutor view: accepted students. */
	students: number;
	/** Student view: next meeting of an enrolled tutorial. */
	next_meeting_date: string;
	/** Student view: already accepted into this tutorial. */
	is_enrolled: boolean;
};

export type Income = {
	this_month: number;
	this_year: number;
	payments_month: number;
	payments_year: number;
	/** YYYY-MM */
	month: string;
	year: number;
};

export type PendingAttachment = {
	meeting_id: string;
	title: string;
	date: string;
	tutorial_id: string;
	tutorial_name: string;
};

export type PendingHomework = {
	meeting_id: string;
	title: string;
	date: string;
	text_homework: string;
	tutorial_id: string;
	tutorial_name: string;
};

export type TutorDashboard = {
	upcoming_meetings: MeetingItem[];
	active_tutorials: TutorialItem[];
	income: Income;
	pending_attachments: PendingAttachment[];
};

export type StudentDashboard = {
	pending_homework: PendingHomework[];
	upcoming_tutorials: TutorialItem[];
	enrolled_tutorials: TutorialItem[];
};
