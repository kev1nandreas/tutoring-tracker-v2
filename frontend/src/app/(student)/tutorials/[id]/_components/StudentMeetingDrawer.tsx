"use client";

import Drawer from "@mui/material/Drawer";
import {
	CalendarDays,
	Camera,
	Check,
	Clock,
	NotebookPen,
	Paperclip,
	PlayCircle,
	Video,
	X,
} from "lucide-react";
import Button from "@/components/button/Button";
import { formatTimeRange, timeOf } from "@/lib/helper";
import type { StudentMeeting } from "@/types/student-meeting";
import StudentAttendance from "./StudentAttendance";
import StudentMaterials from "./StudentMaterials";

type Props = {
	meeting: StudentMeeting | null;
	onClose: () => void;
	onWatch: (meeting: StudentMeeting) => void;
	/** The tutor turned attendance on for this class. */
	canAttend?: boolean;
};

const longDate = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(`${iso.slice(0, 10)}T00:00:00`));

function Section({
	icon: Icon,
	title,
	children,
}: {
	icon: typeof Video;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-t border-gray-100 px-6 py-5">
			<h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
				<Icon size={16} className="text-brand-700" aria-hidden />
				{title}
			</h3>
			{children}
		</section>
	);
}

/** Side panel with the details of one meeting. Read-only. */
export default function StudentMeetingDrawer({
	meeting,
	onClose,
	onWatch,
	canAttend,
}: Props) {
	return (
		<Drawer
			anchor="right"
			open={meeting !== null}
			onClose={onClose}
			slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 } } } }}
		>
			{meeting && (
				<div className="flex h-full flex-col">
					<header className="bg-graph flex items-start justify-between gap-3 border-b border-[#d8e0f0] px-6 py-5">
						<div className="min-w-0">
							{meeting.is_done ? (
								<span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
									<Check size={12} aria-hidden /> Done
								</span>
							) : (
								<span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-[#d8e0f0]">
									Scheduled
								</span>
							)}
							<h2 className="mt-2 text-xl font-bold leading-snug break-words text-brand-950">
								{meeting.title}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<X size={18} aria-hidden />
						</button>
					</header>

					<div className="flex-1 overflow-y-auto">
						<section className="px-6 py-5">
							<dl className="flex flex-col gap-3 text-sm">
								<div className="flex items-center gap-3">
									<CalendarDays
										size={16}
										className="text-gray-400"
										aria-hidden
									/>
									<dt className="sr-only">Date</dt>
									<dd className="text-gray-900">{longDate(meeting.date)}</dd>
								</div>
								<div className="flex items-center gap-3">
									<Clock size={16} className="text-gray-400" aria-hidden />
									<dt className="sr-only">Time</dt>
									<dd className="tabular-nums text-gray-900">
										{formatTimeRange(
											timeOf(meeting.time_start),
											timeOf(meeting.time_end),
										) || "No time set"}
									</dd>
								</div>
							</dl>
						</section>

						<Section icon={NotebookPen} title="Homework">
							{meeting.has_homework ? (
								<p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
									{meeting.text_homework ||
										"There is homework, but no instructions were added yet."}
								</p>
							) : (
								<p className="text-sm text-gray-400">
									No homework for this meeting.
								</p>
							)}
						</Section>

						{canAttend && (
							<Section icon={Camera} title="Attendance">
								<StudentAttendance meetingId={meeting.id} />
							</Section>
						)}

						<Section icon={Paperclip} title="Materials">
							<StudentMaterials meetingId={meeting.id} />
						</Section>

						<Section icon={Video} title="Recording">
							{meeting.video_id ? (
								<Button
									variant="brand"
									size="sm"
									leftIcon={PlayCircle}
									onClick={() => onWatch(meeting)}
								>
									Watch recording
								</Button>
							) : (
								<p className="text-sm text-gray-400">
									{meeting.is_done
										? "No recording for this meeting."
										: "The recording appears here after the meeting."}
								</p>
							)}
						</Section>
					</div>

					<footer className="flex justify-end border-t border-gray-100 px-6 py-4">
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
					</footer>
				</div>
			)}
		</Drawer>
	);
}
