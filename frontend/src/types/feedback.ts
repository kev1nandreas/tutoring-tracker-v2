export type FeedbackFormInfo = {
	tutorial_name: string;
	tutor_name: string;
	open: boolean;
};

export type FeedbackAnswers = {
	email: string;
	delivery_rating: number;
	interactive_rating: number;
	learn_again_rating: number;
	unclear_topics: string;
	message: string;
};

export type FeedbackStatus = { required: boolean; code: string };

export type FeedbackItem = Omit<FeedbackAnswers, "email"> & {
	created_at: string;
};

export type FeedbackSummary = {
	count: number;
	avg_delivery: number;
	avg_interactive: number;
	avg_learn_again: number;
	items: FeedbackItem[];
};
