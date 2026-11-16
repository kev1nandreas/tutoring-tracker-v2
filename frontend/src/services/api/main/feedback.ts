import { ApiError } from "@/lib/errors";
import { get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type {
	FeedbackAnswers,
	FeedbackFormInfo,
	FeedbackStatus,
	FeedbackSummary,
} from "@/types/feedback";

function fail(Kind: unknown, status: number, fallback: string): never {
	if (status === 429)
		throw new ApiError("Too many requests. Please wait a moment.", 429);
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, status);
}

export async function fetchFeedbackForm(code: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<FeedbackFormInfo>>(
		MAIN_ENDPOINT.Feedback.Form(code),
	);
	if (!OK) fail(Kind, StatusCode, "Could not load the form.");
	return (Kind as MainResponse<FeedbackFormInfo>).data as FeedbackFormInfo;
}

export async function submitFeedback(code: string, answers: FeedbackAnswers) {
	const { OK, Kind, StatusCode } = await post<MainResponse<boolean>>(
		MAIN_ENDPOINT.Feedback.Form(code),
		answers,
	);
	if (!OK) fail(Kind, StatusCode, "Could not send your feedback.");
}

export async function fetchFeedbackStatus(tutorialId: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<FeedbackStatus>>(
		MAIN_ENDPOINT.Feedback.Status(tutorialId),
	);
	if (!OK) fail(Kind, StatusCode, "Could not check feedback.");
	return (Kind as MainResponse<FeedbackStatus>).data as FeedbackStatus;
}

export async function fetchFeedbackSummary(tutorialId: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<FeedbackSummary>>(
		MAIN_ENDPOINT.Feedback.Summary(tutorialId),
	);
	if (!OK) fail(Kind, StatusCode, "Could not load feedback.");
	return (Kind as MainResponse<FeedbackSummary>).data as FeedbackSummary;
}
