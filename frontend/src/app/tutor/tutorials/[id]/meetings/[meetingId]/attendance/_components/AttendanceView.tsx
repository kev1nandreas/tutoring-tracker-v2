"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import PhotoDialog from "@/components/attendance/PhotoDialog";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import { useAttendanceRoster } from "@/hooks/useAttendance";
import PageTemplate from "@/layouts/template/PageTemplate";
import { ApiError } from "@/lib/errors";
import { getInitials } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { RosterStudent } from "@/types/attendance";
import { useTutorialQuery } from "../../../../_hooks/useTutorialDetail";
import { useMeetingQuery } from "../../homework/_hooks/useMeetingQuery";
import AttendanceHeader from "./AttendanceHeader";

type Props = { tutorialId: string; meetingId: string };

const timeOf = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));

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

function PresentCard({ s, onOpen }: { s: RosterStudent; onOpen: () => void }) {
	return (
		<li className="overflow-hidden rounded-xl border border-gray-200 bg-white">
			<button
				type="button"
				onClick={onOpen}
				aria-label={`View attendance photo of ${s.name}`}
				className="block aspect-[4/3] w-full overflow-hidden bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600"
			>
				{/* biome-ignore lint/performance/noImgElement: short-lived signed URL, not optimisable */}
				<img
					src={s.photo_url}
					alt=""
					className="h-full w-full object-cover transition-transform hover:scale-[1.03] motion-reduce:transition-none"
				/>
			</button>
			<div className="flex items-center justify-between gap-2 px-3 py-2.5">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
					<p className="truncate text-xs text-gray-500">@{s.username}</p>
				</div>
				{s.marked_at && (
					<span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-green-700">
						{timeOf(s.marked_at)}
					</span>
				)}
			</div>
		</li>
	);
}

export default function AttendanceView({ tutorialId, meetingId }: Props) {
	const tutorial = useTutorialQuery(tutorialId);
	const meeting = useMeetingQuery(meetingId);
	const roster = useAttendanceRoster(meetingId);
	const [photo, setPhoto] = React.useState<RosterStudent | null>(null);

	const breadcrumbs = [
		{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
		{ name: "Tutorials", redirect: PATH.TUTORIALS, isClickable: true },
		{
			name: tutorial.data?.name ?? "Tutorial",
			redirect: `${PATH.TUTORIALS}/${tutorialId}`,
			isClickable: true,
		},
		{
			name: `Attendance · ${meeting.data?.title ?? "Meeting"}`,
			redirect: PATH.TUTORIALS,
			isClickable: false,
		},
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

	// 403: the tutor turned attendance off for this tutorial
	if (roster.error instanceof ApiError && roster.error.status === 403) {
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				<Message
					title="Attendance is turned off"
					text="Turn on Attendance in Edit tutorial to let students check in with a photo."
					tutorialId={tutorialId}
				/>
			</PageTemplate>
		);
	}

	if (meeting.isLoading || roster.isLoading || !meeting.data || !roster.data) {
		return (
			<PageTemplate breadcrumbs={breadcrumbs}>
				{roster.isError ? (
					<DashboardError
						message={roster.error.message}
						onRetry={() => roster.refetch()}
					/>
				) : (
					<div
						className="h-44 animate-pulse rounded-xl bg-gray-100"
						aria-busy="true"
					/>
				)}
			</PageTemplate>
		);
	}

	const present = roster.data.students.filter((s) => s.present);
	const absent = roster.data.students.filter((s) => !s.present);

	return (
		<PageTemplate breadcrumbs={breadcrumbs}>
			<AttendanceHeader
				meeting={meeting.data}
				present={roster.data.present}
				total={roster.data.total}
			/>

			{roster.data.total === 0 ? (
				<div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-500">
					No students have joined this class yet.
				</div>
			) : (
				<div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
					<section aria-label="Present students">
						{present.length === 0 ? (
							<div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-400">
								Nobody has checked in yet.
							</div>
						) : (
							<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{present.map((s) => (
									<PresentCard
										key={s.user_id}
										s={s}
										onOpen={() => setPhoto(s)}
									/>
								))}
							</ul>
						)}
					</section>

					<aside className="rounded-xl border border-gray-200 bg-white lg:sticky lg:top-20">
						<h2 className="flex items-center justify-between border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
							Absent
							<span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
								{absent.length}
							</span>
						</h2>
						{absent.length === 0 ? (
							<p className="px-5 py-6 text-center text-sm text-gray-400">
								Everyone is here.
							</p>
						) : (
							<ul className="divide-y divide-gray-100">
								{absent.map((s) => (
									<li
										key={s.user_id}
										className="flex items-center gap-3 px-5 py-2.5"
									>
										<span
											aria-hidden
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500"
										>
											{getInitials(s.name)}
										</span>
										<span className="min-w-0 flex-1 truncate text-sm text-gray-700">
											{s.name}
										</span>
										<span className="shrink-0 text-xs text-gray-400">
											@{s.username}
										</span>
									</li>
								))}
							</ul>
						)}
					</aside>
				</div>
			)}

			<PhotoDialog
				url={photo?.photo_url ?? null}
				title={photo ? `${photo.name}: attendance photo` : ""}
				onClose={() => setPhoto(null)}
			/>
		</PageTemplate>
	);
}
