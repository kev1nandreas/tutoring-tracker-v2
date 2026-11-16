import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	createPayment,
	deletePayment,
	updatePayment,
} from "@/services/api/main/payment";
import type { PaymentRequest } from "@/types/payment";

/** A payment changes the income card on the dashboard too. */
const useRefresh = () => {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: ["payments"] });
		queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
	};
};

export const useSavePaymentMutation = (
	id: string | undefined,
	{ onSuccess }: { onSuccess?: () => void } = {},
) => {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: (data: PaymentRequest) =>
			id ? updatePayment(id, data) : createPayment(data),
		onSuccess: () => {
			toast.success(id ? "Payment updated." : "Payment added.");
			refresh();
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};

export const useDeletePaymentMutation = ({
	onSuccess,
}: {
	onSuccess?: () => void;
} = {}) => {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: deletePayment,
		onSuccess: () => {
			toast.success("Payment deleted.");
			refresh();
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
