import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateTutorial } from "@/services/api/main/tutorial";
import type { CreateTutorialRequest } from "@/types/tutorial";

export const useUpdateTutorialMutation = (
	id: string,
	{ onSuccess }: { onSuccess?: () => void } = {},
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateTutorialRequest) => updateTutorial(id, data),
		onSuccess: () => {
			toast.success("Tutorial updated.");
			queryClient.invalidateQueries({ queryKey: ["tutorials"] });
			queryClient.invalidateQueries({ queryKey: ["tutorial", id] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
