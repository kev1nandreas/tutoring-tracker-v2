import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/errors";
import { fetchMeetingAttachments } from "@/services/api/main/attachment";

export const attachmentsKey = (meetingId: string) =>
	["meeting", meetingId, "attachments"] as const;

/** Files of a meeting. Pass null to stay idle (for example while a drawer is closed). */
export const useMeetingAttachments = (meetingId: string | null) =>
	useQuery({
		queryKey: attachmentsKey(meetingId ?? ""),
		queryFn: () => fetchMeetingAttachments(meetingId as string),
		enabled: meetingId !== null,
		// 403 / 404 will not change on retry
		retry: (count, error) =>
			!(error instanceof ApiError && [403, 404].includes(error.status)) &&
			count < 2,
	});
