"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import PageTemplate from "@/layouts/template/PageTemplate";
import { ApiError } from "@/lib/errors";
import { PATH } from "@/shared/path";
import { useTutorialQuery } from "../../../../_hooks/useTutorialDetail";
import { useTutorialStudents } from "../../../../_hooks/useTutorialStudents";
import { useMeetingQuery } from "../_hooks/useMeetingQuery";
import { useMeetingSubmissions } from "../_hooks/useMeetingSubmissions";
import HomeworkHeader from "./HomeworkHeader";
import NotSubmittedList from "./NotSubmittedList";
import SubmissionCard from "./SubmissionCard";

type Props = { tutorialId: string; meetingId: string };

function Message({
	title,
	text,
	tutorialId,
}: {
	title: string;
	text: string;
	tutorialId: string;
}) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
			<Typography weight="semibold" className="text-lg text-gray-900">
				{title}
			</Typography>
			<Typography className="max-w-sm text-sm text-gray-500">{text}</Typography>
			<Link
				href={`${PATH.TUTORIALS}/${tutorialId}`}
				className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<ArrowLeft size={14} aria-hidden /> Back to the tutorial
			</Link>
		</div>
	);
}

export default function HomeworkView({ tutorialId, meetingId }: Props) {
	const tutorial = useTutorialQuery(tutorialId);
	const meeting = useMeetingQuery(meetingId);
	const submissions = useMeetingSubmissions(meetingId);
	const enrolled = useTutorialStudents(tutorialId, "accepted");

	const tutorialName = tutorial.data?.name ?? "Tutorial";
	const meetingTitle = meeting.data?.title ?? "Meeting";
	const breadcrumbs = [
		{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
		{ name: "Tutorials", redirect: PATH.TUTORIALS, isClickable: true },
		{
			name: tutorialName,
			redirect: `${PATH.TUTORIALS}/${tutorialId}`,
			isClickable: true,
		},
		{ name: "Homework", redirect: PATH.TUTORIALS, isClickable: false },
	];

	if (meeting.isError || tutorial.isError) {
		const error = meeting.error ?? tutorial.error;
		const notFound = error instanceof ApiError && error.status === 404;
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				{notFound ? (
					<Message
						title="Meeting not found"
						text="It may have been deleted, or it belongs to another tutor."
						tutorialId={tutorialId}
					/>
				) : (
					<DashboardError
						message={error?.message ?? "Something went wrong."}
						onRetry={() => {
							meeting.refetch();
							tutorial.refetch();
						}}
					/>
				)}
			</PageTemplate>
		);
	}

	if (meeting.isLoading || !meeting.data) {
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				<div
					className="h-44 animate-pulse rounded-xl bg-gray-100"
					aria-busy="true"
				/>
			</PageTemplate>
		);
	}

	const m = meeting.data;
	// the meeting must belong to this tutorial, so a mixed-up URL does not show wrong data
	if (m.tutorial_id !== tutorialId) {
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				<Message
					title="Meeting not found"
					text="This meeting is not part of this tutorial."
					tutorialId={tutorialId}
				/>
			</PageTemplate>
		);
	}
	if (!m.has_homework) {
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				<Message
					title="No homework for this meeting"
					text="Turn on homework in the meeting settings to collect submissions."
					tutorialId={tutorialId}
				/>
			</PageTemplate>
		);
	}

	const items = submissions.data ?? [];
	const submittedIds = new Set(items.map((s) => s.user_id));
	const enrolledList = enrolled.data?.items ?? [];
	const notSubmitted = enrolledList.filter((s) => !submittedIds.has(s.user_id));
	const grades = items.flatMap((s) => (s.grade === null ? [] : [s.grade]));
	const average = grades.length
		? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
		: null;

	return (
		<PageTemplate
			breadcrumbs={breadcrumbs.map((b) =>
				b.name === "Homework"
					? { ...b, name: `Homework · ${meetingTitle}` }
					: b,
			)}
		>
			<HomeworkHeader
				meeting={m}
				enrolled={Math.max(enrolledList.length, items.length)}
				submitted={items.length}
				graded={grades.length}
				average={average}
			/>

			<div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<section
					aria-label="Submissions"
					className="flex min-w-0 flex-col gap-3"
				>
					{submissions.isError ? (
						<DashboardError
							message={submissions.error.message}
							onRetry={() => submissions.refetch()}
						/>
					) : submissions.isLoading ? (
						[0, 1, 2].map((i) => (
							<div
								key={i}
								className="h-36 animate-pulse rounded-xl bg-gray-100"
								aria-busy="true"
							/>
						))
					) : items.length === 0 ? (
						<div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-400">
							No submissions yet.
						</div>
					) : (
						<ul className="flex flex-col gap-3">
							{items.map((s) => (
								<SubmissionCard
									key={s.id}
									submission={s}
									meetingId={meetingId}
								/>
							))}
						</ul>
					)}
				</section>

				<aside className="flex flex-col gap-4 lg:sticky lg:top-20">
					<section className="rounded-xl border border-gray-200 bg-white">
						<h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
							Instructions
						</h2>
						<p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-gray-700">
							{m.text_homework || (
								<span className="text-gray-400">
									No instructions were added.
								</span>
							)}
						</p>
					</section>
					{!enrolled.isLoading && <NotSubmittedList students={notSubmitted} />}
				</aside>
			</div>
		</PageTemplate>
	);
}
