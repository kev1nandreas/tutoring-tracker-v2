import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import { put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { homeForRole } from "@/shared/path";
import type { MainResponse } from "@/types/api";
import type { CompleteProfileRequest } from "@/types/complete-profile";
import type { LoginResponse } from "@/types/login";

export const useCompleteProfileMutation = () => {
	const router = useRouter();
	const redirect = useSearchParams().get("redirect");
	const login = useAuthStore.useLogin();

	return useMutation({
		mutationFn: async (data: CompleteProfileRequest) => {
			const { Kind, OK } = await put<MainResponse<LoginResponse>>(
				MAIN_ENDPOINT.User.Profile,
				data,
			);
			const response = Kind as MainResponse<LoginResponse>;
			if (!OK || !response?.data?.token) {
				throw new Error(
					response?.error ||
						response?.message ||
						"Could not save your details.",
				);
			}
			return response.data;
		},
		onSuccess: ({ token, user }) => {
			// the username is part of the token, so the new one replaces the old
			login({ ...user, access_token: token });
			toast.success("All set. Welcome!");
			const safe =
				redirect?.startsWith("/") &&
				!redirect.startsWith("//") &&
				redirect !== "/"
					? redirect
					: null;
			router.replace(safe ?? homeForRole(user.role));
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
