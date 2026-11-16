import { useQuery } from "@tanstack/react-query";
import { fetchMyEnrollments } from "@/services/api/main/enroll";

export const MY_ENROLLMENTS_KEY = ["enrollments", "mine"] as const;

export const useMyEnrollments = () =>
	useQuery({ queryKey: MY_ENROLLMENTS_KEY, queryFn: fetchMyEnrollments });
