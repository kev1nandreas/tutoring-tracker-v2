import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	fetchTutorialStudents,
	validateStudents,
} from "@/services/api/main/student";
import type { StudentStatus, ValidateAction } from "@/types/student";

export const useTutorialStudents = (
	tutorialId: string,
	status: StudentStatus,
) =>
	useQuery({
		queryKey: ["tutorial", tutorialId, "students", status],
		queryFn: () => fetchTutorialStudents(tutorialId, status),
	});

/** Accept or decline one student's request, then refresh every status list. */
export const useValidateStudentMutation = (
	tutorialId: string,
	tutorialCode: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			action,
		}: {
			userId: string;
			action: ValidateAction;
		}) => validateStudents(tutorialCode, [userId], action),
		onSuccess: (_, { action }) => {
			toast.success(
				action === "accept" ? "Student accepted." : "Request rejected.",
			);
			queryClient.invalidateQueries({
				queryKey: ["tutorial", tutorialId, "students"],
			});
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
