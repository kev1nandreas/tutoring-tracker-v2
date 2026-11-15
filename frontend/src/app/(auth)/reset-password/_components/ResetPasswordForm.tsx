"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import Typography from "@/components/Typography";
import { useFadeInUp } from "@/hooks/useGsapAnimation";
import {
	type ResetPasswordRequest,
	resetPasswordRequestSchema,
} from "@/types/reset-password";
import { useResetPasswordMutation } from "../_hooks/useResetPasswordMutation";

export default function ResetPasswordForm() {
	const animationRef = useFadeInUp<HTMLDivElement>({ duration: 2 });

	const methods = useForm<ResetPasswordRequest>({
		resolver: zodResolver(resetPasswordRequestSchema),
		defaultValues: { new_password: "", confirm_new_password: "" },
	});

	const mutation = useResetPasswordMutation();

	const { handleSubmit } = methods;

	const onSubmit: SubmitHandler<ResetPasswordRequest> = async (data) => {
		mutation.mutate(data);
	};

	return (
		<div ref={animationRef} className="rounded-2xl bg-white p-10 shadow-xl">
			<Typography as="h1" className="text-3xl" weight="bold">
				Reset Password
			</Typography>
			<Typography className="mt-1 text-gray-500">
				Enter your new password below to regain access to your account.
			</Typography>

			<FormProvider {...methods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="mt-6 flex flex-col gap-4"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							New Password
						</LabelText>
						<Input
							id="new_password"
							type="password"
							placeholder="Enter your new password"
							leftIcon={Lock}
							autoComplete="new-password"
						/>
					</div>

					<div className="mb-3">
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Confirm New Password
						</LabelText>
						<Input
							id="confirm_new_password"
							type="password"
							placeholder="Re-enter your new password"
							leftIcon={Lock}
							autoComplete="new-password"
						/>
					</div>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						isLoading={mutation.isPending}
						className="w-full"
					>
						Reset Password
					</Button>
				</form>
			</FormProvider>
		</div>
	);
}
