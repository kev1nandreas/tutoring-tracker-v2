import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	fetchMeetingSubmissions,
	gradeSubmission,
} from "@/services/api/main/submission";
import type { GradeFormValues } from "@/types/submission";

export const useMeetingSubmissions = (meetingId: string | null) =>
	useQuery({
		queryKey: ["meeting", meetingId, "submissions"],
		queryFn: () => fetchMeetingSubmissions(meetingId as string),
		enabled: meetingId !== null,
	});

export const useGradeSubmissionMutation = (meetingId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, values }: { id: string; values: GradeFormValues }) =>
			gradeSubmission(id, Number(values.grade), values.feedback),
		onSuccess: () => {
			toast.success("Grade saved.");
			queryClient.invalidateQueries({
				queryKey: ["meeting", meetingId, "submissions"],
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
