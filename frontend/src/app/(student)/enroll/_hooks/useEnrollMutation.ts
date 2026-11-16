import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollInTutorial } from "@/services/api/main/enroll";
import { MY_ENROLLMENTS_KEY } from "./useMyEnrollments";

export const useEnrollMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: enrollInTutorial,
		// the home page lists upcoming tutorials with an "Enrolled" flag
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: MY_ENROLLMENTS_KEY });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
		},
	});
};
