import { useQuery } from "@tanstack/react-query";
import { fetchStudentDashboard } from "@/services/api/main/dashboard";

export const useStudentDashboard = () =>
	useQuery({
		queryKey: ["dashboard", "student"],
		queryFn: fetchStudentDashboard,
		staleTime: 30 * 1000,
	});
