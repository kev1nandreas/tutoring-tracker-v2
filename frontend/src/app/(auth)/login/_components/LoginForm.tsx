"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import AccountLockedPopUp from "@/components/dialog/AccountLockedPopUp";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import { useFadeInUp } from "@/hooks/useGsapAnimation";
import { PATH } from "@/shared/path";
import { type LoginRequest, loginRequestSchema } from "@/types/login";
import { useLoginMutation } from "../_hooks/useLoginMutation";

export default function LoginForm() {
	const animationRef = useFadeInUp<HTMLDivElement>({ duration: 2 });

	const [lockedUntil, setLockedUntil] = React.useState<string | null>(null);

	const methods = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: { email: "", password: "" },
	});

	const mutation = useLoginMutation({ onAccountLocked: setLockedUntil });

	const { handleSubmit } = methods;

	const onSubmit: SubmitHandler<LoginRequest> = async (data) => {
		mutation.mutate(data);
	};

	return (
		<div ref={animationRef} className="rounded-2xl bg-white p-10 shadow-xl">
			<AccountLockedPopUp
				isOpen={!!lockedUntil}
				setIsOpen={(open) => !open && setLockedUntil(null)}
				lockedUntil={lockedUntil}
			/>

			<Typography as="h1" className="text-3xl" weight="bold">
				Welcome Back
			</Typography>
			<Typography className="mt-1 text-gray-500">
				Login to continue to your account
			</Typography>

			<FormProvider {...methods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="mt-6 flex flex-col gap-4"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Email Address
						</LabelText>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
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
						Sign In
					</Button>

					<div className="flex items-center justify-end">
						<PrimaryLink
							href={PATH.FORGOT_PASSWORD}
							size="small"
							underline={false}
							className="text-brand-600 hover:text-brand-700 font-semibold"
						>
							Forgot Password?
						</PrimaryLink>
					</div>
				</form>
			</FormProvider>
		</div>
	);
}
