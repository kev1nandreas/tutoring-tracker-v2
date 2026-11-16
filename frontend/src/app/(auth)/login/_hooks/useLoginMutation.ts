import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { homeForRole } from "@/shared/path";
import type { MainResponse } from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/login";

export const useLoginMutation = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect");

	const { login } = useAuthStore();

	return useMutation({
		mutationFn: async (data: LoginRequest) => {
			const { Kind, OK } = await post<MainResponse<LoginResponse>>(
				MAIN_ENDPOINT.Auth.Login,
				data,
			);
			const response = Kind as MainResponse<LoginResponse>;
			const token = response?.data?.token;

			if (!OK || !token) {
				throw new Error(
					response?.error ||
						response?.message ||
						"Unable to sign in. Please try again.",
				);
			}

			const user = response.data?.user;
			if (!user)
				throw new Error("Unable to load your profile. Please try again.");

			return { token, user };
		},
		onSuccess: ({ token, user }) => {
			login({ ...user, access_token: token });
			toast.success(`Welcome back, ${user.name}!`);
			// Only follow same-site redirects; the layout bounces wrong-role access.
			const safe =
				redirect?.startsWith("/") && !redirect.startsWith("//")
					? redirect
					: null;
			router.push(safe ?? homeForRole(user.role));
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to sign in. Please try again.");
		},
	});
};
