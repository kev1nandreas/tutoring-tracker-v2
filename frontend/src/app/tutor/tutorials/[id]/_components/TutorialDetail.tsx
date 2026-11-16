"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import PageTemplate from "@/layouts/template/PageTemplate";
import { ApiError } from "@/lib/errors";
import { PATH } from "@/shared/path";
import {
	useTutorialMeetingsQuery,
	useTutorialQuery,
} from "../_hooks/useTutorialDetail";
import MeetingLedger from "./MeetingLedger";
import StudentsCard from "./StudentsCard";
import TutorialActions from "./TutorialActions";
import TutorialHeader from "./TutorialHeader";
import TutorialInfoCard from "./TutorialInfoCard";

const breadcrumbs = (name: string) => [
	{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
	{ name: "Tutorials", redirect: PATH.TUTORIALS, isClickable: true },
	{ name, redirect: PATH.TUTORIALS, isClickable: false },
];

function NotFound() {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
			<Typography weight="semibold" className="text-lg text-gray-900">
				Tutorial not found
			</Typography>
			<Typography className="max-w-sm text-sm text-gray-500">
				It may have been deleted, or it belongs to another tutor.
			</Typography>
			<Link
				href={PATH.TUTORIALS}
				className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<ArrowLeft size={14} aria-hidden /> Back to tutorials
			</Link>
		</div>
	);
}

export default function TutorialDetail({ id }: { id: string }) {
	const tutorialQuery = useTutorialQuery(id);
	const meetingsQuery = useTutorialMeetingsQuery(id);

	const { data: tutorial, error, isError, isLoading, refetch } = tutorialQuery;
	const meetings = meetingsQuery.data?.items;

	if (isError) {
		return (
			<PageTemplate title="Tutorial" breadcrumbs={breadcrumbs("Tutorial")}>
				{error instanceof ApiError && error.status === 404 ? (
					<NotFound />
				) : (
					<DashboardError message={error.message} onRetry={() => refetch()} />
				)}
			</PageTemplate>
		);
	}

	return (
		<PageTemplate breadcrumbs={breadcrumbs(tutorial?.name ?? "Tutorial")}>
			{isLoading || !tutorial ? (
				<div
					className="h-44 animate-pulse rounded-xl bg-gray-100"
					aria-busy="true"
				/>
			) : (
				<TutorialHeader
					tutorial={tutorial}
					actions={<TutorialActions tutorial={tutorial} />}
					totalMeetings={meetings?.length ?? 0}
					doneMeetings={meetings?.filter((m) => m.is_done).length ?? 0}
					homeworkMeetings={meetings?.filter((m) => m.has_homework).length ?? 0}
				/>
			)}

			<div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="flex min-w-0 flex-col gap-4">
					{meetingsQuery.isError ? (
						<DashboardError
							message={meetingsQuery.error.message}
							onRetry={() => meetingsQuery.refetch()}
						/>
					) : (
						<MeetingLedger
							tutorialId={id}
							meetings={meetings}
							isLoading={meetingsQuery.isLoading}
						/>
					)}
					{tutorial && (
						<StudentsCard tutorialId={id} tutorialCode={tutorial.custom_id} />
					)}
				</div>
				{tutorial && <TutorialInfoCard tutorial={tutorial} />}
			</div>
		</PageTemplate>
	);
}
