"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Pencil } from "lucide-react";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import TextArea from "@/components/form/TextArea";
import clsxm from "@/lib/clsxm";
import { getInitials } from "@/lib/helper";
import {
	fileLinks,
	type GradeFormValues,
	gradeFormSchema,
	type Submission,
} from "@/types/submission";
import { useGradeSubmissionMutation } from "../_hooks/useMeetingSubmissions";

const submittedAt = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));

const gradeTone = (g: number) =>
	g >= 75
		? "bg-green-50 text-green-700"
		: g >= 50
			? "bg-amber-50 text-amber-700"
			: "bg-red-50 text-red-700";

/** One student's submission: what they sent, and the tutor's grade and feedback. */
export default function SubmissionCard({
	submission,
	meetingId,
}: {
	submission: Submission;
	meetingId: string;
}) {
	const [isGrading, setIsGrading] = React.useState(false);
	const links = fileLinks(submission.files);
	const name = submission.user?.name ?? "Unknown student";

	const methods = useForm<GradeFormValues>({
		resolver: zodResolver(gradeFormSchema),
		defaultValues: {
			grade: String(submission.grade ?? ""),
			feedback: submission.feedback ?? "",
		},
	});
	const mutation = useGradeSubmissionMutation(meetingId);

	const startGrading = () => {
		methods.reset({
			grade: submission.grade === null ? "" : String(submission.grade),
			feedback: submission.feedback ?? "",
		});
		setIsGrading(true);
	};

	const onSubmit: SubmitHandler<GradeFormValues> = (values) =>
		mutation.mutate(
			{ id: submission.id, values },
			{ onSuccess: () => setIsGrading(false) },
		);

	return (
		<li className="rounded-xl border border-gray-200 bg-white p-4">
			<div className="flex items-start gap-3">
				<span
					aria-hidden
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700"
				>
					{getInitials(name)}
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-gray-900">{name}</p>
					<p className="truncate text-xs text-gray-500">
						{submission.user ? `@${submission.user.username}` : ""}
						{submission.user?.school ? ` · ${submission.user.school}` : ""}
					</p>
					<p className="text-xs text-gray-400">
						Submitted {submittedAt(submission.created_at)}
					</p>
				</div>
				{submission.grade !== null && (
					<span
						className={clsxm(
							"shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums",
							gradeTone(submission.grade),
						)}
					>
						{submission.grade}
						<span className="text-xs font-medium opacity-70">/100</span>
					</span>
				)}
			</div>

			{submission.answer && (
				<p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-700">
					{submission.answer}
				</p>
			)}

			{links.length > 0 && (
				<ul className="mt-3 flex flex-col gap-1.5">
					{links.map((link) => (
						<li key={link}>
							<a
								href={link}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex max-w-full items-center gap-1.5 text-sm text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
							>
								<FileText size={14} aria-hidden className="shrink-0" />
								<span className="truncate">{link}</span>
							</a>
						</li>
					))}
				</ul>
			)}

			{isGrading ? (
				<FormProvider {...methods}>
					<form
						onSubmit={methods.handleSubmit(onSubmit)}
						noValidate
						className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4"
					>
						<div className="max-w-[140px]">
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Grade (0–100)
							</LabelText>
							<Input
								id="grade"
								type="number"
								min={0}
								max={100}
								step={1}
								autoFocus
							/>
						</div>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Feedback (optional)
							</LabelText>
							<TextArea
								id="feedback"
								rows={3}
								maxLength={500}
								placeholder="What went well, what to improve"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsGrading(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="brand"
								size="sm"
								isLoading={mutation.isPending}
							>
								Save grade
							</Button>
						</div>
					</form>
				</FormProvider>
			) : (
				<div className="mt-3 flex items-start justify-between gap-3 border-t border-gray-100 pt-3">
					<p className="min-w-0 text-sm text-gray-600">
						{submission.feedback ? (
							<span className="whitespace-pre-wrap">{submission.feedback}</span>
						) : (
							<span className="text-gray-400">
								{submission.grade === null ? "Not graded yet." : "No feedback."}
							</span>
						)}
					</p>
					<Button
						variant={submission.grade === null ? "brand" : "outline"}
						size="sm"
						leftIcon={Pencil}
						onClick={startGrading}
					>
						{submission.grade === null ? "Grade" : "Edit grade"}
					</Button>
				</div>
			)}
		</li>
	);
}
