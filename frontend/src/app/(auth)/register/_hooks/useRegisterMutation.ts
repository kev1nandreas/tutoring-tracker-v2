import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { PATH } from "@/shared/path";
import type { MainResponse } from "@/types/api";
import type { RegisterRequest } from "@/types/register";

export const useRegisterMutation = () => {
	const router = useRouter();

	return useMutation({
		mutationFn: async (data: RegisterRequest) => {
			// confirm_password is a client-only field.
			const { confirm_password: _confirm, ...payload } = data;
			const { Kind, OK } = await post<MainResponse>(
				MAIN_ENDPOINT.Auth.Register,
				payload,
			);

			if (!OK) {
				const response = Kind as MainResponse;
				throw new Error(
					response?.error ||
						response?.message ||
						"Unable to register. Please try again.",
				);
			}
		},
		onSuccess: () => {
			toast.success("Account created. Please sign in.");
			router.push(PATH.LOGIN);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});
};
