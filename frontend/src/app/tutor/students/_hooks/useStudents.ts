import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchStudentDetail,
	fetchStudents,
	type StudentListParams,
} from "@/services/api/main/tutor-student";

export const useStudents = (params: StudentListParams) =>
	useQuery({
		queryKey: ["tutor-students", params],
		queryFn: () => fetchStudents(params),
		placeholderData: keepPreviousData,
	});

export const useStudentDetail = (id: string | null) =>
	useQuery({
		queryKey: ["tutor-student", id],
		queryFn: () => fetchStudentDetail(id as string),
		enabled: id !== null,
	});
