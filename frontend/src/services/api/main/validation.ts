import { ApiError } from "@/lib/errors";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { PaginatedMainResponse } from "@/types/api";
import {
	STUDENT_STATUS_CODE,
	type StudentStatus,
	type ValidationGroup,
} from "@/types/student";

export type ValidationGroupParams = {
	status: StudentStatus;
	page: number;
	pageSize: number;
	/** Matches student name, username or school. */
	search?: string;
};

/** Enrollment requests of all my tutorials, grouped by tutorial (paginated over tutorials). */
export async function fetchValidationGroups({
	status,
	page,
	pageSize,
	search,
}: ValidationGroupParams) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<ValidationGroup>
	>(MAIN_ENDPOINT.Enrollment.List, {
		is_validated: STUDENT_STATUS_CODE[status],
		page,
		page_size: pageSize,
		...(search ? { q: search } : {}),
	});
	const response = Kind as PaginatedMainResponse<ValidationGroup>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load requests.",
			StatusCode,
		);
	}
	return { groups: response.data ?? [], meta: response.meta };
}
