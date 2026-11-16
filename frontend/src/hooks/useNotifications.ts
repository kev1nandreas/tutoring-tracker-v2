import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import useAuthStore from "@/app/stores/useAuthStore";
import {
	fetchNotifications,
	markNotificationRead,
	type NotificationFilter,
} from "@/services/api/main/notification";

export const NOTIFICATIONS_KEY = ["notifications"] as const;

/** How often the unread badge checks for new notifications. */
const POLL_MS = 60_000;

export const useNotifications = (params: {
	page: number;
	pageSize: number;
	filter: NotificationFilter;
}) => {
	const userId = useAuthStore((s) => s.user?.id);
	return useQuery({
		queryKey: [...NOTIFICATIONS_KEY, "list", userId, params],
		queryFn: () => fetchNotifications(userId as string, params),
		enabled: Boolean(userId),
		placeholderData: keepPreviousData,
		refetchInterval: POLL_MS,
	});
};

/** Number of unread notifications (for the bell badge). */
export const useUnreadCount = () => {
	const userId = useAuthStore((s) => s.user?.id);
	return useQuery({
		queryKey: [...NOTIFICATIONS_KEY, "unread", userId],
		queryFn: () =>
			fetchNotifications(userId as string, {
				page: 1,
				pageSize: 1,
				filter: "unread",
			}),
		select: (data) => data.meta?.total_items ?? data.items.length,
		enabled: Boolean(userId),
		refetchInterval: POLL_MS,
	});
};

export const useMarkRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markNotificationRead,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
	});
};
