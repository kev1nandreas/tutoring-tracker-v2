import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createTutorial } from "@/services/api/main/tutorial";

export const useCreateTutorialMutation = ({
	onSuccess,
}: {
	onSuccess?: () => void;
} = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTutorial,
		onSuccess: () => {
			toast.success("Tutorial created.");
			queryClient.invalidateQueries({ queryKey: ["tutorials"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
