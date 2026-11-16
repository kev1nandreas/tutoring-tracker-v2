import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchTutorials,
	type TutorialListParams,
} from "@/services/api/main/tutorial";

export const useTutorialsQuery = (params: TutorialListParams) =>
	useQuery({
		queryKey: ["tutorials", params],
		queryFn: () => fetchTutorials(params),
		placeholderData: keepPreviousData,
	});
