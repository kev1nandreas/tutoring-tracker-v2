"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";
import { type EnrollFormValues, enrollSchema } from "@/types/enroll";
import { useEnrollMutation } from "../_hooks/useEnrollMutation";
import EnrollmentHistory from "./EnrollmentHistory";

const STEPS = [
	{
		title: "Get the class code",
		text: "Your tutor shares a 6-character code, such as AB12CD.",
	},
	{
		title: "Enter it here",
		text: "We find the class and send your request to the tutor.",
	},
	{
		title: "Wait for approval",
		text: "Once the tutor accepts you, the class shows up on your home page.",
	},
];

export default function EnrollView({
	initialCode = "",
}: {
	initialCode?: string;
}) {
	const [sentCode, setSentCode] = React.useState<string | null>(null);
	const [serverError, setServerError] = React.useState<string | null>(null);

	const methods = useForm<EnrollFormValues>({
		resolver: zodResolver(enrollSchema),
		defaultValues: { tutorial_code: initialCode },
	});
	const mutation = useEnrollMutation();

	// "Ask again" on a declined request: fill the code in and focus the form.
	const askAgain = (code: string) => {
		setSentCode(null);
		setServerError(null);
		methods.reset({ tutorial_code: code });
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const onSubmit: SubmitHandler<EnrollFormValues> = (values) => {
		setServerError(null);
		const parsed = enrollSchema.parse(values);
		mutation.mutate(parsed, {
			onSuccess: () => setSentCode(parsed.tutorial_code),
			onError: (error) => setServerError(error.message),
		});
	};

	return (
		<div className="flex flex-col gap-5">
			<div>
				<Typography
					as="h1"
					weight="semibold"
					className="text-2xl text-gray-900"
				>
					Join a class
				</Typography>
				<Typography className="text-sm text-gray-500">
					Ask to join a class with the code from your tutor.
				</Typography>
			</div>

			<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
				<section className="rounded-xl border border-gray-200 bg-white p-6">
					{sentCode ? (
						<output className="flex flex-col items-start gap-3">
							<CheckCircle2 size={36} className="text-green-600" aria-hidden />
							<Typography
								as="h2"
								weight="semibold"
								className="text-lg text-gray-900"
							>
								Request sent
							</Typography>
							<Typography className="max-w-md text-sm text-gray-600">
								Your request for class{" "}
								<strong className="tabular-nums">{sentCode}</strong> is waiting
								for the tutor. You will see the class on your home page once it
								is accepted.
							</Typography>
							<div className="mt-2 flex flex-wrap gap-2">
								<Link
									href={PATH.STUDENT_HOME}
									className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
								>
									Back to home
								</Link>
								<Button
									variant="outline"
									onClick={() => {
										setSentCode(null);
										methods.reset({ tutorial_code: "" });
									}}
								>
									Join another class
								</Button>
							</div>
						</output>
					) : (
						<FormProvider {...methods}>
							<form
								onSubmit={methods.handleSubmit(onSubmit)}
								noValidate
								className="flex max-w-sm flex-col gap-4"
							>
								<div>
									<LabelText labelTextClasname="mb-1.5 font-semibold">
										Class code
									</LabelText>
									<Input
										id="tutorial_code"
										placeholder="e.g. AB12CD"
										leftIcon={KeyRound}
										autoComplete="off"
										autoFocus
									/>
								</div>

								{serverError && (
									<p
										role="alert"
										className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
									>
										{serverError}
									</p>
								)}

								<Button
									type="submit"
									variant="brand"
									size="lg"
									isLoading={mutation.isPending}
								>
									Request to join
								</Button>
							</form>
						</FormProvider>
					)}
				</section>

				<aside className="bg-graph rounded-xl border border-[#d8e0f0] p-6">
					<h2 className="text-base font-semibold text-brand-950">
						How it works
					</h2>
					<ol className="mt-4 flex flex-col gap-4">
						{STEPS.map((step, i) => (
							<li key={step.title} className="flex gap-3">
								<span
									aria-hidden
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700 ring-1 ring-[#d8e0f0]"
								>
									{i + 1}
								</span>
								<div>
									<p className="text-sm font-medium text-gray-900">
										{step.title}
									</p>
									<p className="mt-0.5 text-sm leading-relaxed text-gray-600">
										{step.text}
									</p>
								</div>
							</li>
						))}
					</ol>
				</aside>
			</div>

			<EnrollmentHistory onAskAgain={askAgain} />
		</div>
	);
}
