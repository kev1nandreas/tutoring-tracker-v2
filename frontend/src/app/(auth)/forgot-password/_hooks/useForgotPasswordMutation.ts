import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { ApiResponse } from "@/types/api";
import type { ForgotPasswordRequest } from "@/types/forgot-password";

interface UseForgotPasswordMutationProps {
	onSuccess?: () => void;
}

export const useForgotPasswordMutation = ({
	onSuccess,
}: UseForgotPasswordMutationProps = {}) => {
	return useMutation({
		mutationFn: async (data: ForgotPasswordRequest) => {
			const { Kind, OK } = await post<ApiResponse<null>>(
				MAIN_ENDPOINT.Auth.ForgotPassword,
				data as unknown as Record<string, unknown>,
			);

			if (!OK) {
				throw new Error(
					(Kind as ApiResponse<null>)?.message ??
						"Unable to send reset link. Please try again.",
				);
			}

			return (Kind as ApiResponse<null>).data;
		},
		onSuccess: () => {
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to send reset link. Please try again.",
			);
		},
	});
};
