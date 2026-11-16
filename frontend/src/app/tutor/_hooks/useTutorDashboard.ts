import { useQuery } from "@tanstack/react-query";
import { fetchTutorDashboard } from "@/services/api/main/dashboard";

export const useTutorDashboard = () =>
	useQuery({
		queryKey: ["dashboard", "tutor"],
		queryFn: fetchTutorDashboard,
		staleTime: 30 * 1000,
	});
