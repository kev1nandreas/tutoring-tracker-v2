import { ApiError } from "@/lib/errors";
import { get, patch } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { Notification } from "@/types/notification";

export type NotificationFilter = "all" | "unread";

export type NotificationListParams = {
	page: number;
	pageSize: number;
	filter: NotificationFilter;
};

export async function fetchNotifications(
	userId: string,
	{ page, pageSize, filter }: NotificationListParams,
) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<Notification>
	>(MAIN_ENDPOINT.Notification.ByUser(userId), {
		page,
		page_size: pageSize,
		sort: "created_at",
		order: "desc",
		...(filter === "unread" ? { is_read: false } : {}),
	});
	const response = Kind as PaginatedMainResponse<Notification>;

	if (!OK) {
		throw new ApiError(
			response?.error || response?.message || "Failed to load notifications.",
			StatusCode,
		);
	}
	return { items: response.data ?? [], meta: response.meta };
}

export async function markNotificationRead(id: string) {
	const { OK, Kind, StatusCode } = await patch<MainResponse<Notification>>(
		MAIN_ENDPOINT.Notification.Read(id),
		{},
	);
	if (!OK) {
		const response = Kind as MainResponse;
		throw new ApiError(
			response?.error || response?.message || "Could not mark as read.",
			StatusCode,
		);
	}
}
