import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchValidationGroups,
	type ValidationGroupParams,
} from "@/services/api/main/validation";

export const useValidationGroups = (params: ValidationGroupParams) =>
	useQuery({
		queryKey: ["pending-validations", params],
		queryFn: () => fetchValidationGroups(params),
		placeholderData: keepPreviousData,
	});
