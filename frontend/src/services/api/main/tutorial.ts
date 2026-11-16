import { ApiError } from "@/lib/errors";
import { del, get, post, put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { Meeting } from "@/types/meeting";
import type {
	CreateTutorialRequest,
	Tutorial,
	TutorialStatus,
} from "@/types/tutorial";

export type TutorialListParams = {
	page: number;
	pageSize: number;
	status: TutorialStatus;
};

export async function fetchTutorials({
	page,
	pageSize,
	status,
}: TutorialListParams) {
	const params: Record<string, unknown> = {
		page,
		page_size: pageSize,
		sort: "created_at",
		order: "desc",
	};
	if (status !== "all") params.is_done = status === "done";

	const { OK, Kind } = await get<PaginatedMainResponse<Tutorial>>(
		MAIN_ENDPOINT.Tutorial.List,
		params,
	);
	const response = Kind as PaginatedMainResponse<Tutorial>;

	if (!OK) {
		throw new Error(
			response?.error || response?.message || "Failed to load tutorials.",
		);
	}
	return { items: response.data ?? [], meta: response.meta };
}

export async function createTutorial(data: CreateTutorialRequest) {
	const { OK, Kind } = await post<MainResponse<Tutorial>>(
		MAIN_ENDPOINT.Tutorial.List,
		data,
	);
	const response = Kind as MainResponse<Tutorial>;

	if (!OK) {
		throw new Error(
			response?.error || response?.message || "Failed to create the tutorial.",
		);
	}
	return response.data;
}

export async function fetchTutorial(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<Tutorial>>(
		MAIN_ENDPOINT.Tutorial.Detail(id),
	);
	const response = Kind as MainResponse<Tutorial>;

	if (!OK || !response?.data) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load the tutorial.",
			StatusCode,
		);
	}
	return response.data;
}

/** All meetings of a tutorial, oldest first (one page of up to 100). */
export async function fetchTutorialMeetings(id: string) {
	const { OK, Kind, StatusCode } = await get<PaginatedMainResponse<Meeting>>(
		MAIN_ENDPOINT.Tutorial.Meetings(id),
		{ page: 1, page_size: 100, sort: "date", order: "asc" },
	);
	const response = Kind as PaginatedMainResponse<Meeting>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load meetings.",
			StatusCode,
		);
	}
	return { items: response.data ?? [], total: response.meta?.total_items ?? 0 };
}

export async function updateTutorial(id: string, data: CreateTutorialRequest) {
	const { OK, Kind, StatusCode } = await put<MainResponse<Tutorial>>(
		MAIN_ENDPOINT.Tutorial.Detail(id),
		data,
	);
	const response = Kind as MainResponse<Tutorial>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to update the tutorial.",
			StatusCode,
		);
	}
	return response.data;
}

export async function deleteTutorial(id: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Tutorial.Detail(id),
	);

	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			response?.error || response?.message || "Failed to delete the tutorial.",
			StatusCode,
		);
	}
}
