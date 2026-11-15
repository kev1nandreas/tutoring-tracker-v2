import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import { AccountLockedError } from "@/lib/errors";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { PATH } from "@/shared/path";
import type { ApiResponse } from "@/types/api";
import type {
	AccountLockedErrorData,
	LoginRequest,
	LoginResponse,
} from "@/types/login";

interface UseLoginMutationProps {
	onSuccess?: () => void;
	onAccountLocked?: (lockedUntil: string) => void;
}

export const useLoginMutation = ({
	onSuccess,
	onAccountLocked,
}: UseLoginMutationProps = {}) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect") || PATH.DASHBOARD;

	const { login } = useAuthStore();

	return useMutation({
		mutationFn: async (data: LoginRequest) => {
			const { Kind, OK, StatusCode } = await post<
				ApiResponse<LoginResponse | AccountLockedErrorData>
			>(MAIN_ENDPOINT.Auth.Login, data as unknown as Record<string, unknown>);

			if (!OK) {
				const response = Kind as ApiResponse<AccountLockedErrorData>;
				const retryAfter = response?.data?.retry_after;

				if (StatusCode === 423 && typeof retryAfter === "number") {
					const lockedUntil = new Date(
						Date.now() + retryAfter * 1000,
					).toISOString();

					throw new AccountLockedError(
						response?.message ?? "Account locked.",
						lockedUntil,
					);
				}

				throw new Error(
					response?.message ?? "Unable to sign in. Please try again.",
				);
			}

			return (Kind as ApiResponse<LoginResponse>).data;
		},
		onSuccess: (data) => {
			login({
				...data.user,
				access_token: data.access_token,
				refresh_token: data.refresh_token,
			});
			toast.success("Signed in successfully.");
			onSuccess?.();

			router.push(redirect);
		},
		onError: (error: Error) => {
			if (error instanceof AccountLockedError) {
				onAccountLocked?.(error.lockedUntil);
				return;
			}

			toast.error(error.message || "Failed to sign in. Please try again.");
		},
	});
};
