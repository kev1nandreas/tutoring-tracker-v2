import { ApiError } from "@/lib/errors";
import { get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { EnrollRequest, MyEnrollment } from "@/types/enroll";

/** What went wrong, in words a student can act on. */
const FRIENDLY: Record<number, string> = {
	404: "No class has that code. Check it with your tutor.",
	409: "You already joined this class, or your request is still waiting for the tutor.",
	400: "That class has already finished.",
	403: "Only students can join a class.",
};

export async function enrollInTutorial({ tutorial_code }: EnrollRequest) {
	const { OK, Kind, StatusCode } = await post<MainResponse>(
		MAIN_ENDPOINT.Enrollment.Enroll,
		{ tutorial_code },
	);

	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			FRIENDLY[StatusCode] ??
				response?.error ??
				response?.message ??
				"Could not send the request.",
			StatusCode,
		);
	}
}

/** The student's own requests, most recently changed first (up to 100). */
export async function fetchMyEnrollments() {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<MyEnrollment>
	>(MAIN_ENDPOINT.Enrollment.Mine, {
		page: 1,
		page_size: 100,
	});
	const response = Kind as PaginatedMainResponse<MyEnrollment>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load your requests.",
			StatusCode,
		);
	}
	return response.data ?? [];
}
