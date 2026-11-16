"use client";

import Drawer from "@mui/material/Drawer";
import {
	CalendarDays,
	Check,
	ClipboardCheck,
	Clock,
	NotebookPen,
	Paperclip,
	Pencil,
	StickyNote,
	Video,
	X,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/button/Button";
import { formatTimeRange, timeOf } from "@/lib/helper";
import { homeworkPath } from "@/shared/path";
import type { Meeting } from "@/types/meeting";
import MeetingMaterials from "./materials/MeetingMaterials";

type Props = {
	meeting: Meeting | null;
	onClose: () => void;
	onEdit: (meeting: Meeting) => void;
	tutorialId: string;
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

/** Side panel with everything about one meeting, homework included. */
export default function MeetingDetailDrawer({
	meeting,
	onClose,
	onEdit,
	tutorialId,
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
							<h2 className="mt-2 text-xl font-bold leading-snug text-brand-950">
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
								<>
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
										{meeting.text_homework ||
											"Homework is assigned, but no instructions were added."}
									</p>
									<div className="mt-3">
										<Link
											href={homeworkPath(tutorialId, meeting.id)}
											className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
										>
											<ClipboardCheck size={14} aria-hidden />
											See homework
										</Link>
									</div>
								</>
							) : (
								<p className="text-sm text-gray-400">
									No homework for this meeting.
								</p>
							)}
						</Section>

						<Section icon={Paperclip} title="Materials">
							<MeetingMaterials
								meetingId={meeting.id}
								meetingTitle={meeting.title}
							/>
						</Section>

						<Section icon={StickyNote} title="Notes">
							{meeting.marks ? (
								<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
									{meeting.marks}
								</p>
							) : (
								<p className="text-sm text-gray-400">No notes yet.</p>
							)}
						</Section>

						<Section icon={Video} title="Recording">
							{meeting.youtube_link ? (
								<a
									href={meeting.youtube_link}
									target="_blank"
									rel="noopener noreferrer"
									className="break-all text-sm text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
								>
									{meeting.youtube_link}
								</a>
							) : (
								<p className="text-sm text-gray-400">No recording link yet.</p>
							)}
						</Section>
					</div>

					<footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
						<Button
							variant="brand"
							leftIcon={Pencil}
							onClick={() => onEdit(meeting)}
						>
							Edit meeting
						</Button>
					</footer>
				</div>
			)}
		</Drawer>
	);
}
