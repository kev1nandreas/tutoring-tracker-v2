import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchPayments,
	type PaymentListParams,
} from "@/services/api/main/payment";

export const usePayments = (params: PaymentListParams) =>
	useQuery({
		queryKey: ["payments", params],
		queryFn: () => fetchPayments(params),
		placeholderData: keepPreviousData,
	});
