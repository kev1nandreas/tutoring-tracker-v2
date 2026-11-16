"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import { ApiError } from "@/lib/errors";
import { PATH } from "@/shared/path";
import {
	useMyTutorial,
	useMyTutorialMeetings,
} from "../_hooks/useMyTutorialDetail";
import DownloadPackageCard from "./DownloadPackageCard";
import StudentMeetingList from "./StudentMeetingList";
import StudentTutorialHeader from "./StudentTutorialHeader";
import TutorialDetailsCard from "./TutorialDetailsCard";

function BackLink() {
	return (
		<Link
			href={PATH.STUDENT_TUTORIALS}
			className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
		>
			<ArrowLeft size={14} aria-hidden /> My tutorials
		</Link>
	);
}

export default function MyTutorialDetail({ id }: { id: string }) {
	const tutorialQuery = useMyTutorial(id);
	const meetingsQuery = useMyTutorialMeetings(id);
	const { data: tutorial, isError, error, isLoading, refetch } = tutorialQuery;

	if (isError) {
		const notFound = error instanceof ApiError && error.status === 404;
		return (
			<div className="flex flex-col gap-4">
				<BackLink />
				{notFound ? (
					<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
						<Typography weight="semibold" className="text-lg text-gray-900">
							Tutorial not found
						</Typography>
						<Typography className="max-w-sm text-sm text-gray-500">
							It may have been removed, or you have not been accepted into it
							yet.
						</Typography>
					</div>
				) : (
					<DashboardError message={error.message} onRetry={() => refetch()} />
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<BackLink />

			{isLoading || !tutorial ? (
				<div
					className="h-44 animate-pulse rounded-xl bg-gray-100"
					aria-busy="true"
				/>
			) : (
				<StudentTutorialHeader
					tutorial={tutorial}
					meetings={meetingsQuery.data}
				/>
			)}

			<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				{meetingsQuery.isError ? (
					<DashboardError
						message={meetingsQuery.error.message}
						onRetry={() => meetingsQuery.refetch()}
					/>
				) : (
					<StudentMeetingList
						meetings={meetingsQuery.data}
						isLoading={meetingsQuery.isLoading}
						canAttend={tutorial?.can_attend}
					/>
				)}
				{tutorial && (
					<div className="flex flex-col gap-4 lg:sticky lg:top-6">
						<TutorialDetailsCard tutorial={tutorial} />
						<DownloadPackageCard tutorial={tutorial} />
					</div>
				)}
			</div>
		</div>
	);
}
