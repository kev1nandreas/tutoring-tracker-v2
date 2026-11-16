"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Phone, School, User } from "lucide-react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";
import { type RegisterRequest, registerRequestSchema } from "@/types/register";
import { useRegisterMutation } from "../_hooks/useRegisterMutation";

export default function RegisterForm() {
	const methods = useForm<RegisterRequest>({
		resolver: zodResolver(registerRequestSchema),
		defaultValues: {
			name: "",
			school: "",
			phone: "",
			email: "",
			username: "",
			password: "",
			confirm_password: "",
		},
	});

	const mutation = useRegisterMutation();

	const onSubmit: SubmitHandler<RegisterRequest> = (data) => {
		mutation.mutate(data);
	};

	return (
		<div>
			<Typography
				as="h1"
				className="auth-display text-[2rem] leading-tight"
				weight="bold"
			>
				Create your account
			</Typography>
			<Typography className="mt-2 text-[var(--ink-soft)]">
				Sign up as a student. Your tutor will add you to their classes.
			</Typography>

			<FormProvider {...methods}>
				<form
					onSubmit={methods.handleSubmit(onSubmit)}
					className="mt-8 flex flex-col gap-5"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Full Name
						</LabelText>
						<Input
							id="name"
							placeholder="Enter your full name"
							leftIcon={User}
							autoComplete="name"
						/>
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

					<div className="grid gap-4 sm:grid-cols-2">
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

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Password
							</LabelText>
							<Input
								id="password"
								type="password"
								placeholder="At least 8 characters"
								leftIcon={Lock}
								autoComplete="new-password"
							/>
						</div>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Confirm Password
							</LabelText>
							<Input
								id="confirm_password"
								type="password"
								placeholder="Repeat your password"
								leftIcon={Lock}
								autoComplete="new-password"
							/>
						</div>
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

					<Typography className="text-sm text-[var(--ink-soft)]">
						Already have an account?{" "}
						<PrimaryLink
							href={PATH.LOGIN}
							size="small"
							underline={false}
							className="text-brand-600 hover:text-brand-700 font-semibold"
						>
							Sign in
						</PrimaryLink>
					</Typography>
				</form>
			</FormProvider>
		</div>
	);
}
