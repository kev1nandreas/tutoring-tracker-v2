"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import GoogleSignInButton from "@/components/button/GoogleSignInButton";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";
import { type LoginRequest, loginRequestSchema } from "@/types/login";
import { useLoginMutation } from "../_hooks/useLoginMutation";

export default function LoginForm() {
	const methods = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: { email: "", password: "" },
	});

	const mutation = useLoginMutation();
	const redirect = useSearchParams().get("redirect");

	const { handleSubmit } = methods;

	const onSubmit: SubmitHandler<LoginRequest> = async (data) => {
		mutation.mutate(data);
	};

	return (
		<div>
			<Typography
				as="h1"
				className="auth-display text-[2rem] leading-tight"
				weight="bold"
			>
				Welcome back
			</Typography>
			<Typography className="mt-2 text-[var(--ink-soft)]">
				Sign in with your email to see your lessons and homework.
			</Typography>

			<FormProvider {...methods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="mt-8 flex flex-col gap-5"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Email address
						</LabelText>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							leftIcon={Mail}
							autoComplete="email"
						/>
					</div>

					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Password
						</LabelText>
						<Input
							id="password"
							type="password"
							placeholder="Enter your password"
							leftIcon={Lock}
							autoComplete="current-password"
						/>
					</div>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						isLoading={mutation.isPending}
						className="w-full"
					>
						Sign in
					</Button>

					<div className="flex items-center gap-3 text-xs text-[var(--ink-soft)]">
						<span className="h-px flex-1 bg-gray-200" />
						or
						<span className="h-px flex-1 bg-gray-200" />
					</div>

					<GoogleSignInButton redirect={redirect} />

					<Typography className="text-sm text-[var(--ink-soft)]">
						Don&apos;t have an account?{" "}
						<PrimaryLink
							href={PATH.REGISTER}
							size="small"
							underline={false}
							className="text-brand-600 hover:text-brand-700 font-semibold"
						>
							Create one
						</PrimaryLink>
					</Typography>
				</form>
			</FormProvider>
		</div>
	);
}
