import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { deleteTutorial } from "@/services/api/main/tutorial";

export const useDeleteTutorialMutation = (
	id: string,
	{ onSuccess }: { onSuccess?: () => void } = {},
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => deleteTutorial(id),
		onSuccess: () => {
			toast.success("Tutorial deleted.");
			queryClient.removeQueries({ queryKey: ["tutorial", id] });
			queryClient.invalidateQueries({ queryKey: ["tutorials"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
