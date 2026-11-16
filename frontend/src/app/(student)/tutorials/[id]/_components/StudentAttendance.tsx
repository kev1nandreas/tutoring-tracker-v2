"use client";

import { Camera, CheckCircle2, Clock } from "lucide-react";
import * as React from "react";
import PhotoDialog from "@/components/attendance/PhotoDialog";
import Button from "@/components/button/Button";
import { useMarkAttendance, useMyAttendance } from "@/hooks/useAttendance";
import { ATTENDANCE_ACCEPT } from "@/types/attendance";

const timeOf = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));

/** Check in to a meeting with a photo. Only possible on the meeting day. */
export default function StudentAttendance({
	meetingId,
}: {
	meetingId: string;
}) {
	const { data, isLoading, isError, error } = useMyAttendance(meetingId);
	const { mark, stage, percent, isBusy } = useMarkAttendance(meetingId);
	const [isPhotoOpen, setIsPhotoOpen] = React.useState(false);
	const input = React.useRef<HTMLInputElement>(null);

	if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
	if (isError)
		return (
			<p className="text-sm text-gray-400">
				{error.message || "Could not load your attendance."}
			</p>
		);
	if (!data) return null;

	const pick = (
		<>
			<input
				ref={input}
				type="file"
				accept={ATTENDANCE_ACCEPT}
				className="sr-only"
				aria-label="Choose a photo for attendance"
				tabIndex={-1}
				onChange={(e) => {
					const file = e.target.files?.[0];
					e.target.value = ""; // allow choosing the same file again
					if (file) mark(file);
				}}
			/>
		</>
	);

	// uploading: show progress instead of the buttons
	if (isBusy) {
		return (
			<output className="flex flex-col gap-2">
				<p className="text-sm font-medium text-gray-900">
					{stage === "saving"
						? "Saving your attendance…"
						: `Uploading photo… ${percent}%`}
				</p>
				<div
					role="progressbar"
					aria-valuenow={stage === "saving" ? 100 : percent}
					aria-valuemin={0}
					aria-valuemax={100}
					className="h-1.5 overflow-hidden rounded-full bg-gray-100"
				>
					<div
						className="h-full rounded-full bg-brand-600 transition-[width] duration-200 motion-reduce:transition-none"
						style={{ width: `${stage === "saving" ? 100 : percent}%` }}
					/>
				</div>
			</output>
		);
	}

	if (data.marked) {
		return (
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3">
					{data.photo_url && (
						<button
							type="button"
							onClick={() => setIsPhotoOpen(true)}
							aria-label="View your attendance photo"
							className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							{/* biome-ignore lint/performance/noImgElement: short-lived signed URL, not optimisable */}
							<img
								src={data.photo_url}
								alt=""
								className="h-full w-full object-cover"
							/>
						</button>
					)}
					<div className="min-w-0">
						<p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
							<CheckCircle2 size={16} aria-hidden /> Present
						</p>
						{data.marked_at && (
							<p className="text-xs text-gray-500">
								Marked at {timeOf(data.marked_at)}
							</p>
						)}
					</div>
				</div>
				{data.can_mark && (
					<>
						{pick}
						<Button
							variant="outline"
							size="sm"
							leftIcon={Camera}
							onClick={() => input.current?.click()}
						>
							Replace photo
						</Button>
					</>
				)}
				<PhotoDialog
					url={isPhotoOpen ? (data.photo_url ?? null) : null}
					title="Your attendance photo"
					onClose={() => setIsPhotoOpen(false)}
				/>
			</div>
		);
	}

	if (data.can_mark) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm text-gray-600">
					Add a photo to mark that you are here.
				</p>
				{pick}
				<Button
					variant="brand"
					leftIcon={Camera}
					onClick={() => input.current?.click()}
				>
					Take or choose a photo
				</Button>
			</div>
		);
	}

	return (
		<p className="flex items-center gap-1.5 text-sm text-gray-400">
			<Clock size={14} aria-hidden /> Attendance can only be marked on the day
			of the meeting.
		</p>
	);
}
