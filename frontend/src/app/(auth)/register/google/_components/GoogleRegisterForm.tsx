"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Phone, School, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signOut } from "next-auth/react";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import Typography from "@/components/Typography";
import { ApiError } from "@/lib/errors";
import { post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { homeForRole, PATH } from "@/shared/path";
import type { MainResponse } from "@/types/api";
import {
	type GoogleRegisterValues,
	googleRegisterSchema,
} from "@/types/google-register";
import type { LoginResponse } from "@/types/login";

type Identity = { token: string; email: string; name: string };

/** Second step of "Sign up with Google": the details Google does not give. */
export default function GoogleRegisterForm() {
	const router = useRouter();
	const redirect = useSearchParams().get("redirect");
	const login = useAuthStore.useLogin();
	const [identity, setIdentity] = React.useState<Identity | null>(null);

	const methods = useForm<GoogleRegisterValues>({
		resolver: zodResolver(googleRegisterSchema),
		defaultValues: { name: "", school: "", phone: "", username: "" },
	});

	// The Google identity waits in the short NextAuth session. Without it there is
	// nothing to finish, so go back to sign in.
	React.useEffect(() => {
		let cancelled = false;
		getSession().then((session) => {
			if (cancelled) return;
			if (!session?.registration) {
				router.replace(PATH.LOGIN);
				return;
			}
			setIdentity(session.registration);
			methods.reset({
				name: session.registration.name,
				school: "",
				phone: "",
				username: "",
			});
		});
		return () => {
			cancelled = true;
		};
	}, [router, methods]);

	const mutation = useMutation({
		mutationFn: async (values: GoogleRegisterValues) => {
			if (!identity) throw new Error("Your Google sign-in expired.");
			const { OK, Kind, StatusCode } = await post<MainResponse<LoginResponse>>(
				MAIN_ENDPOINT.Auth.RegisterGoogle,
				{ registration_token: identity.token, ...values },
			);
			const response = Kind as MainResponse<LoginResponse>;
			if (!OK || !response?.data?.token) {
				throw new ApiError(
					response?.error ||
						response?.message ||
						"Could not create your account.",
					StatusCode,
				);
			}
			return response.data;
		},
		onSuccess: async ({ token, user }) => {
			login({ ...user, access_token: token });
			await signOut({ redirect: false }); // the app has its own session now
			toast.success(`Welcome, ${user.name}!`);
			const safe =
				redirect?.startsWith("/") &&
				!redirect.startsWith("//") &&
				redirect !== "/"
					? redirect
					: null;
			router.replace(safe ?? homeForRole(user.role));
		},
		onError: (error: Error) => {
			toast.error(error.message);
			// an expired Google session cannot be retried here: start over
			if (error instanceof ApiError && error.status === 401) {
				router.replace(PATH.LOGIN);
			}
		},
	});

	const onSubmit: SubmitHandler<GoogleRegisterValues> = (values) =>
		mutation.mutate(values);

	if (!identity) {
		return (
			<Typography aria-busy="true" className="text-[var(--ink-soft)]">
				One moment…
			</Typography>
		);
	}

	return (
		<div>
			<Typography
				as="h1"
				className="auth-display text-[2rem] leading-tight"
				weight="bold"
			>
				Finish signing up
			</Typography>
			<Typography className="mt-2 text-[var(--ink-soft)]">
				There is no account for this Google email yet. Add a few details to
				create your student account.
			</Typography>

			<div className="mt-6 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
				<Mail size={16} aria-hidden className="shrink-0" />
				<span className="min-w-0 break-all">{identity.email}</span>
				<span className="ml-auto shrink-0 text-xs font-medium text-green-700">
					Verified by Google
				</span>
			</div>

			<FormProvider {...methods}>
				<form
					onSubmit={methods.handleSubmit(onSubmit)}
					className="mt-6 flex flex-col gap-5"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Full Name
						</LabelText>
						<Input id="name" leftIcon={User} autoComplete="name" />
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							School
						</LabelText>
						<Input
							id="school"
							placeholder="Enter your school"
							leftIcon={School}
							autoComplete="organization"
						/>
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Phone
						</LabelText>
						<Input
							id="phone"
							type="tel"
							placeholder="08xxxxxxxxxx"
							leftIcon={Phone}
							autoComplete="tel"
						/>
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Username
						</LabelText>
						<Input
							id="username"
							placeholder="Choose a username"
							leftIcon={User}
							autoComplete="username"
						/>
					</div>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						isLoading={mutation.isPending}
						className="w-full"
					>
						Create account
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={async () => {
							await signOut({ redirect: false });
							router.replace(PATH.LOGIN);
						}}
					>
						Cancel
					</Button>
				</form>
			</FormProvider>
		</div>
	);
}
