import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	fetchTutorialStudents,
	unenrollStudent,
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

/** Remove an enrolled student, then refresh the lists and the dashboard counts. */
export const useUnenrollStudentMutation = (tutorialId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => unenrollStudent(tutorialId, userId),
		onSuccess: () => {
			toast.success("Student removed from the tutorial.");
			queryClient.invalidateQueries({
				queryKey: ["tutorial", tutorialId, "students"],
			});
			queryClient.invalidateQueries({ queryKey: ["tutor-student"] });
			queryClient.invalidateQueries({ queryKey: ["tutor-students"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
