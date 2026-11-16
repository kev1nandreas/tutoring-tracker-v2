import { ApiError } from "@/lib/errors";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { PaginatedMainResponse } from "@/types/api";
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
