import { ApiError } from "@/lib/errors";
import { get, put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { Submission } from "@/types/submission";

/** Submissions of one meeting, oldest first (up to 100). */
export async function fetchMeetingSubmissions(meetingId: string) {
	const { OK, Kind, StatusCode } = await get<PaginatedMainResponse<Submission>>(
		MAIN_ENDPOINT.Meeting.Submissions(meetingId),
		{ page: 1, page_size: 100, sort: "created_at", order: "asc" },
	);
	const response = Kind as PaginatedMainResponse<Submission>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load submissions.",
			StatusCode,
		);
	}
	return response.data ?? [];
}

export async function gradeSubmission(
	id: string,
	grade: number,
	feedback: string,
) {
	const { OK, Kind, StatusCode } = await put<MainResponse<Submission>>(
		MAIN_ENDPOINT.Submission.Grade(id),
		{
			grade,
			feedback,
		},
	);
	const response = Kind as MainResponse<Submission>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to save the grade.",
			StatusCode,
		);
	}
	return response.data;
}
