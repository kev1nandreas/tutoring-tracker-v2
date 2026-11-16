import { ApiError } from "@/lib/errors";
import { del, get, post, put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { Meeting, MeetingFormValues } from "@/types/meeting";

export async function createMeeting(
	tutorialId: string,
	data: MeetingFormValues,
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<Meeting>>(
		MAIN_ENDPOINT.Meeting.Create,
		{
			...data,
			tutorial_id: tutorialId,
		},
	);
	const response = Kind as MainResponse<Meeting>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to create the meeting.",
			StatusCode,
		);
	}
	return response.data;
}

export async function updateMeeting(id: string, data: MeetingFormValues) {
	const { OK, Kind, StatusCode } = await put<MainResponse<Meeting>>(
		MAIN_ENDPOINT.Meeting.Detail(id),
		data,
	);
	const response = Kind as MainResponse<Meeting>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to update the meeting.",
			StatusCode,
		);
	}
	return response.data;
}

export async function fetchMeeting(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<Meeting>>(
		MAIN_ENDPOINT.Meeting.Detail(id),
	);
	const response = Kind as MainResponse<Meeting>;

	if (!OK || !response?.data) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load the meeting.",
			StatusCode,
		);
	}
	return response.data;
}

/** Deletes the meeting; the server also removes its files, submissions and attendance photos. */
export async function deleteMeeting(id: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Meeting.Detail(id),
	);
	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			response?.error || response?.message || "Failed to delete the meeting.",
			StatusCode,
		);
	}
}
