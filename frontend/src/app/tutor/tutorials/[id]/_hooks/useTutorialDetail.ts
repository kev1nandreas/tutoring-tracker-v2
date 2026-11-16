import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/errors";
import {
	fetchTutorial,
	fetchTutorialMeetings,
} from "@/services/api/main/tutorial";

// A missing tutorial will not appear on retry, so do not retry 404s.
const retry = (count: number, error: Error) =>
	!(error instanceof ApiError && error.status === 404) && count < 2;

export const useTutorialQuery = (id: string) =>
	useQuery({
		queryKey: ["tutorial", id],
		queryFn: () => fetchTutorial(id),
		retry,
	});

export const useTutorialMeetingsQuery = (id: string) =>
	useQuery({
		queryKey: ["tutorial", id, "meetings"],
		queryFn: () => fetchTutorialMeetings(id),
		retry,
	});
