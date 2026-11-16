import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/app/stores/useAuthStore";
import { fetchPendingCount } from "@/services/api/main/validation";

/** How often the sidebar badge checks for new enrollment requests. */
const POLL_MS = 60_000;

/** Number of pending enrollment requests (tutor sidebar badge). */
export const usePendingCount = () => {
	const userId = useAuthStore((s) => s.user?.id);
	return useQuery({
		queryKey: ["pending-validations", "count", userId],
		queryFn: fetchPendingCount,
		enabled: Boolean(userId),
		refetchInterval: POLL_MS,
	});
};
