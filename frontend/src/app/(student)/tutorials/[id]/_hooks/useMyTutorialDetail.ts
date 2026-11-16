import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/errors";
import {
	fetchMyTutorial,
	fetchMyTutorialMeetings,
} from "@/services/api/main/my-tutorials";

// a missing or foreign tutorial will not appear on retry
const retry = (count: number, error: Error) =>
	!(error instanceof ApiError && error.status === 404) && count < 2;

export const useMyTutorial = (id: string) =>
	useQuery({
		queryKey: ["my-tutorial", id],
		queryFn: () => fetchMyTutorial(id),
		retry,
	});

export const useMyTutorialMeetings = (id: string) =>
	useQuery({
		queryKey: ["my-tutorial", id, "meetings"],
		queryFn: () => fetchMyTutorialMeetings(id),
		retry,
	});
