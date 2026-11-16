import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchMyTutorials,
	type MyTutorialsParams,
} from "@/services/api/main/my-tutorials";

export const useMyTutorials = (params: MyTutorialsParams) =>
	useQuery({
		queryKey: ["my-tutorials", params],
		queryFn: () => fetchMyTutorials(params),
		placeholderData: keepPreviousData,
	});
