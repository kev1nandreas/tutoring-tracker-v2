import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/errors";
import { fetchMeeting } from "@/services/api/main/meeting";

export const useMeetingQuery = (meetingId: string) =>
	useQuery({
		queryKey: ["meeting", meetingId],
		queryFn: () => fetchMeeting(meetingId),
		// a missing meeting will not appear on retry
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 2,
	});
