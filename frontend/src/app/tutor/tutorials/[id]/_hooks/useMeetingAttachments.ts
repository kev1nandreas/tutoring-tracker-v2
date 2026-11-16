import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { attachmentsKey } from "@/hooks/useMeetingAttachments";
import { deleteAttachment } from "@/services/api/main/attachment";

export const useDeleteAttachment = (meetingId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteAttachment,
		onSuccess: () => {
			toast.success("File deleted.");
			queryClient.invalidateQueries({ queryKey: attachmentsKey(meetingId) });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
