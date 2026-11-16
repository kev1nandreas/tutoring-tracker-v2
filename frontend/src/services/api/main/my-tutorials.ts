import { ApiError } from "@/lib/errors";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { StudentMeeting } from "@/types/student-meeting";
import type {
	EnrolledFilter,
	EnrolledTutorial,
} from "@/types/student-tutorial";

export type MyTutorialsParams = {
	page: number;
	pageSize: number;
	status: EnrolledFilter;
};

/** Tutorials the student was accepted into, running ones first. */
export async function fetchMyTutorials({
	page,
	pageSize,
	status,
}: MyTutorialsParams) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<EnrolledTutorial>
	>(MAIN_ENDPOINT.Me.Tutorials, {
		page,
		page_size: pageSize,
		...(status === "all" ? {} : { status }),
	});
	const response = Kind as PaginatedMainResponse<EnrolledTutorial>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load your tutorials.",
			StatusCode,
		);
	}
	return { items: response.data ?? [], meta: response.meta };
}

/** One tutorial the student was accepted into. A 404 means missing or not theirs. */
export async function fetchMyTutorial(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<EnrolledTutorial>>(
		MAIN_ENDPOINT.Me.Tutorial(id),
	);
	const response = Kind as MainResponse<EnrolledTutorial>;

	if (!OK || !response?.data) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load the tutorial.",
			StatusCode,
		);
	}
	return response.data;
}

/** Meetings of one of the student's tutorials, oldest first (up to 100). */
export async function fetchMyTutorialMeetings(id: string) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<StudentMeeting>
	>(MAIN_ENDPOINT.Me.TutorialMeetings(id), {
		page: 1,
		page_size: 100,
		sort: "date",
		order: "asc",
	});
	const response = Kind as PaginatedMainResponse<StudentMeeting>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load meetings.",
			StatusCode,
		);
	}
	return response.data ?? [];
}
