"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ProgressBar from "@/components/dashboard/ProgressBar";
import { useAttendanceRoster } from "@/hooks/useAttendance";
import { attendancePath } from "@/shared/path";

/** Short attendance summary for the meeting drawer; the full roster has its own page. */
export default function MeetingAttendance({
	meetingId,
	tutorialId,
}: {
	meetingId: string;
	tutorialId: string;
}) {
	const { data, isLoading, isError, error } = useAttendanceRoster(meetingId);

	return (
		<div className="flex flex-col gap-3">
			{isLoading ? (
				<p className="text-sm text-gray-400">Loading…</p>
			) : isError ? (
				<p className="text-sm text-gray-400">{error.message}</p>
			) : data && data.total > 0 ? (
				<ProgressBar
					value={data.present}
					max={data.total}
					label={`${data.present} of ${data.total} present`}
				/>
			) : (
				<p className="text-sm text-gray-400">
					No students have joined this class yet.
				</p>
			)}

			<Link
				href={attendancePath(tutorialId, meetingId)}
				className="inline-flex w-fit items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				See attendance <ArrowRight size={14} aria-hidden />
			</Link>
		</div>
	);
}
