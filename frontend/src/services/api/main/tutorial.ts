import { get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
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
