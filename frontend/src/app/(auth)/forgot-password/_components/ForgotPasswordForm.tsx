"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";
import {
	type ForgotPasswordRequest,
	forgotPasswordRequestSchema,
} from "@/types/forgot-password";
import { useForgotPasswordMutation } from "../_hooks/useForgotPasswordMutation";
import ForgotPasswordSuccess from "./ForgotPasswordSuccess";

export default function ForgotPasswordForm() {
	const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(
		null,
	);

	const methods = useForm<ForgotPasswordRequest>({
		resolver: zodResolver(forgotPasswordRequestSchema),
		defaultValues: { email: "" },
	});

	const mutation = useForgotPasswordMutation({
		onSuccess: () => setSubmittedEmail(methods.getValues("email")),
	});

	const { handleSubmit } = methods;

	const onSubmit: SubmitHandler<ForgotPasswordRequest> = async (data) => {
		mutation.mutate(data);
	};

	if (submittedEmail) {
		return <ForgotPasswordSuccess email={submittedEmail} />;
	}

	return (
		<div className="rounded-2xl bg-white p-10 shadow-xl">
			<Typography as="h1" className="text-3xl" weight="bold">
				Forgot Password
			</Typography>
			<Typography className="mt-1 text-gray-500">
				Enter your email and we&apos;ll send you a link to reset your password.
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
							placeholder="you@example.com"
							leftIcon={Mail}
							autoComplete="email"
						/>
					</div>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						isLoading={mutation.isPending}
						className="w-full"
					>
						Send Reset Link
					</Button>

					<div className="flex items-center justify-center">
						<PrimaryLink
							href={PATH.LOGIN}
							size="small"
							underline={false}
							className="text-brand-600 hover:text-brand-700"
						>
							Back to Login
						</PrimaryLink>
					</div>
				</form>
			</FormProvider>
		</div>
	);
}
