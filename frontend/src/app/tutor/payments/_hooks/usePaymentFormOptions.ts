import { useQuery } from "@tanstack/react-query";
import { fetchTutorials } from "@/services/api/main/tutorial";

/** Every tutorial of the tutor (first 100), to pick from in the payment form. */
export const useTutorialOptions = (enabled: boolean) =>
	useQuery({
		queryKey: ["tutorials", "options"],
		queryFn: () => fetchTutorials({ page: 1, pageSize: 100, status: "all" }),
		enabled,
	});
