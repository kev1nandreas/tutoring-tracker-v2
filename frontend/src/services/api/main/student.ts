import { ApiError } from "@/lib/errors";
import { del, get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import {
	STUDENT_STATUS_CODE,
	type StudentStatus,
	type TutorialStudent,
	type ValidateAction,
} from "@/types/student";

/** Ids whose request changed, and ids that had no pending request. */
export type ValidateResult = { updated: string[]; skipped: string[] };

/** One status of a tutorial's students; `total` is the full count, `items` the first 100. */
export async function fetchTutorialStudents(
	tutorialId: string,
	status: StudentStatus,
) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<TutorialStudent>
	>(MAIN_ENDPOINT.Tutorial.Students(tutorialId), {
		is_validated: STUDENT_STATUS_CODE[status],
		page: 1,
		page_size: 100,
		sort: "created_at",
		order: "asc",
	});
	const response = Kind as PaginatedMainResponse<TutorialStudent>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load students.",
			StatusCode,
		);
	}
	return { items: response.data ?? [], total: response.meta?.total_items ?? 0 };
}

/** Removes an enrolled student from a tutorial. They can ask to join again. */
export async function unenrollStudent(tutorialId: string, userId: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Tutorial.Student(tutorialId, userId),
	);

	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			response?.error || response?.message || "Failed to remove the student.",
			StatusCode,
		);
	}
}

export async function validateStudents(
	tutorialCode: string,
	userIds: string[],
	action: ValidateAction,
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<ValidateResult>>(
		MAIN_ENDPOINT.Enrollment.Validate,
		{
			tutorial_code: tutorialCode,
			user_ids: userIds,
			action,
		},
	);

	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			response?.error || response?.message || "Failed to update the student.",
			StatusCode,
		);
	}
	return (
		(Kind as MainResponse<ValidateResult>).data ?? { updated: [], skipped: [] }
	);
}
