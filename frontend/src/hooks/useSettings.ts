import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import { getToken } from "@/lib/cookies";
import {
	fetchMe,
	saveProfile,
	sendVerificationEmail,
	setEmailNotifications,
	setPassword,
} from "@/services/api/main/settings";

export const ME_KEY = ["me"] as const;

/** The signed-in user, fresh from the server (refetched when the tab regains focus). */
export const useMe = () => useQuery({ queryKey: ME_KEY, queryFn: fetchMe });

export const useSaveProfile = () => {
	const queryClient = useQueryClient();
	const login = useAuthStore.useLogin();
	return useMutation({
		mutationFn: saveProfile,
		onSuccess: ({ token, user }) => {
			// the username is part of the token, so the new one replaces the old
			login({ ...user, access_token: token });
			queryClient.invalidateQueries({ queryKey: ME_KEY });
			toast.success("Profile saved.");
		},
		onError: (e: Error) => toast.error(e.message),
	});
};

export const useSendVerification = () =>
	useMutation({
		mutationFn: sendVerificationEmail,
		onSuccess: () =>
			toast.success("Verification email sent. Check your inbox."),
		onError: (e: Error) => toast.error(e.message),
	});

export const useToggleEmailNotifications = () => {
	const queryClient = useQueryClient();
	const login = useAuthStore.useLogin();
	return useMutation({
		mutationFn: setEmailNotifications,
		onSuccess: (user) => {
			login({ ...user, access_token: getToken() });
			queryClient.setQueryData(ME_KEY, user);
			toast.success(
				user.email_notifications
					? "Email notifications are on."
					: "Email notifications are off.",
			);
		},
		onError: (e: Error) => toast.error(e.message),
	});
};

export const useSetPassword = ({
	onSuccess,
}: {
	onSuccess?: () => void;
} = {}) => {
	const queryClient = useQueryClient();
	const login = useAuthStore.useLogin();
	return useMutation({
		mutationFn: setPassword,
		onSuccess: (user) => {
			login({ ...user, access_token: getToken() });
			queryClient.setQueryData(ME_KEY, user);
			toast.success("Password saved. You can now sign in with your email too.");
			onSuccess?.();
		},
		onError: (e: Error) => toast.error(e.message),
	});
};
