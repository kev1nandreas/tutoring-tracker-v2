import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	createMeeting,
	deleteMeeting,
	updateMeeting,
} from "@/services/api/main/meeting";
import type { MeetingFormValues } from "@/types/meeting";

type Options = { onSuccess?: () => void };

/** Refresh everything that lists this tutorial's meetings. */
function useRefreshMeetings(tutorialId: string) {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({
			queryKey: ["tutorial", tutorialId, "meetings"],
		});
		queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
	};
}

export const useCreateMeetingMutation = (
	tutorialId: string,
	{ onSuccess }: Options = {},
) => {
	const refresh = useRefreshMeetings(tutorialId);

	return useMutation({
		mutationFn: (data: MeetingFormValues) => createMeeting(tutorialId, data),
		onSuccess: () => {
			toast.success("Meeting added.");
			refresh();
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};

export const useUpdateMeetingMutation = (
	meetingId: string,
	tutorialId: string,
	{ onSuccess }: Options = {},
) => {
	const refresh = useRefreshMeetings(tutorialId);

	return useMutation({
		mutationFn: (data: MeetingFormValues) => updateMeeting(meetingId, data),
		onSuccess: () => {
			toast.success("Meeting updated.");
			refresh();
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};

export const useDeleteMeetingMutation = (
	meetingId: string,
	tutorialId: string,
	{ onSuccess }: Options = {},
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => deleteMeeting(meetingId),
		onSuccess: () => {
			toast.success("Meeting deleted.");
			// everything that listed this meeting, or things that belonged to it
			queryClient.removeQueries({ queryKey: ["meeting", meetingId] });
			queryClient.invalidateQueries({
				queryKey: ["tutorial", tutorialId, "meetings"],
			});
			queryClient.invalidateQueries({ queryKey: ["tutorials"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
