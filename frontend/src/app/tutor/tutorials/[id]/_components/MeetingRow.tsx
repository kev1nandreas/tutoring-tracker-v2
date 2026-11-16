import {
	Check,
	ClipboardCheck,
	NotebookPen,
	Pencil,
	Video,
} from "lucide-react";
import Link from "next/link";
import clsxm from "@/lib/clsxm";
import { formatTimeRange, timeOf } from "@/lib/helper";
import { homeworkPath } from "@/shared/path";
import type { Meeting } from "@/types/meeting";

type Props = {
	meeting: Meeting;
	/** First meeting that has not happened yet. */
	isNext: boolean;
	isPast: boolean;
	onEdit: (meeting: Meeting) => void;
	onOpen: (meeting: Meeting) => void;
	tutorialId: string;
};

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });

/** Date tile + title/time + state. Done meetings are muted; the next one is highlighted. */
export default function MeetingRow({
	meeting,
	isNext,
	isPast,
	onEdit,
	onOpen,
	tutorialId,
}: Props) {
	const day = new Date(`${meeting.date.slice(0, 10)}T00:00:00`);
	const needsUpdate = isPast && !meeting.is_done;

	return (
		<li className="group relative flex items-center gap-4 py-3">
			<div
				aria-hidden
				className={clsxm(
					"flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center leading-none",
					isNext
						? "border-[#e8c200] bg-[#ffe36e] text-brand-950"
						: meeting.is_done
							? "border-gray-200 bg-gray-50 text-gray-400"
							: "border-[#d8e0f0] bg-white text-brand-900",
				)}
			>
				<span className="text-[11px] font-medium">{WEEKDAY.format(day)}</span>
				<span className="my-0.5 text-2xl font-bold tabular-nums">
					{day.getDate()}
				</span>
				<span className="text-[11px] font-medium">{MONTH.format(day)}</span>
			</div>

			<div className="min-w-0 flex-1">
				<button
					type="button"
					onClick={() => onOpen(meeting)}
					className={clsxm(
						"block max-w-full truncate rounded text-left text-sm font-medium after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-brand-600",
						meeting.is_done ? "text-gray-500" : "text-gray-900",
					)}
				>
					{meeting.title}
				</button>
				<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
					<span className="tabular-nums">
						{formatTimeRange(
							timeOf(meeting.time_start),
							timeOf(meeting.time_end),
						)}
					</span>
					{meeting.has_homework && (
						<span className="flex items-center gap-1 text-brand-700">
							<NotebookPen size={12} aria-hidden /> Homework
						</span>
					)}
					{meeting.youtube_link && (
						<a
							href={meeting.youtube_link}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 flex items-center gap-1 text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<Video size={12} aria-hidden /> Recording
						</a>
					)}
				</div>
			</div>

			<div className="shrink-0 text-xs font-medium">
				{meeting.is_done ? (
					<span className="flex items-center gap-1 text-green-700">
						<Check size={14} aria-hidden /> Done
					</span>
				) : isNext ? (
					<span className="rounded-full bg-[#ffe36e] px-2.5 py-0.5 text-brand-950">
						Next
					</span>
				) : needsUpdate ? (
					<span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
						Not marked done
					</span>
				) : null}
			</div>

			{meeting.has_homework && (
				<Link
					href={homeworkPath(tutorialId, meeting.id)}
					aria-label={`See homework for ${meeting.title}`}
					className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-md border border-[#d8e0f0] bg-white px-2.5 py-1.5 text-xs font-medium text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					<ClipboardCheck size={14} aria-hidden />
					<span className="hidden sm:inline">See homework</span>
				</Link>
			)}

			<button
				type="button"
				onClick={() => onEdit(meeting)}
				aria-label={`Edit ${meeting.title}`}
				className="relative z-10 shrink-0 rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<Pencil size={16} aria-hidden />
			</button>
		</li>
	);
}
