import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { PATH } from "@/shared/path";
import type { ApiResponse } from "@/types/api";
import type { ResetPasswordRequest } from "@/types/reset-password";

export const useResetPasswordMutation = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const resetToken = searchParams.get("reset_token") ?? "";

	return useMutation({
		mutationFn: async (data: ResetPasswordRequest) => {
			if (!resetToken) {
				throw new Error("Reset link is invalid or has expired.");
			}

			const { Kind, OK } = await post<ApiResponse<null>>(
				MAIN_ENDPOINT.Auth.ResetPassword,
				{ token: resetToken, new_password: data.new_password },
			);

			if (!OK) {
				throw new Error(
					(Kind as ApiResponse<null>)?.message ??
						"Failed to reset password. Please try again.",
				);
			}

			return null;
		},
		onSuccess: () => {
			toast.success("Password updated. Please sign in again.");
			router.push(PATH.LOGIN);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to reset password.");
		},
	});
};
