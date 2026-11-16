import { Check, NotebookPen, PlayCircle } from "lucide-react";
import clsxm from "@/lib/clsxm";
import { formatTimeRange, timeOf } from "@/lib/helper";
import type { StudentMeeting } from "@/types/student-meeting";

type Props = {
	meeting: StudentMeeting;
	isNext: boolean;
	isToday: boolean;
	onOpen: (meeting: StudentMeeting) => void;
	onWatch: (meeting: StudentMeeting) => void;
};

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });

/** Meeting row: click it for the details, or "Recording" to watch right away. */
export default function StudentMeetingRow({
	meeting,
	isNext,
	isToday,
	onOpen,
	onWatch,
}: Props) {
	const day = new Date(`${meeting.date.slice(0, 10)}T00:00:00`);
	const highlight = isNext || isToday;

	return (
		<li className="group relative flex items-start gap-4 py-3">
			<div
				aria-hidden
				className={clsxm(
					"flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center leading-none",
					highlight
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
				<div className="flex flex-wrap items-center justify-between gap-2">
					{/* stretched button: the whole row opens the details */}
					<button
						type="button"
						onClick={() => onOpen(meeting)}
						className={clsxm(
							"min-w-0 rounded text-left text-sm font-medium break-words after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-brand-600",
							meeting.is_done ? "text-gray-500" : "text-gray-900",
						)}
					>
						{meeting.title}
					</button>
					<span className="shrink-0 text-xs font-medium">
						{meeting.is_done ? (
							<span className="flex items-center gap-1 text-green-700">
								<Check size={14} aria-hidden /> Done
							</span>
						) : isToday ? (
							<span className="rounded-full bg-[#ffe36e] px-2.5 py-0.5 text-brand-950">
								Today
							</span>
						) : isNext ? (
							<span className="rounded-full bg-[#ffe36e] px-2.5 py-0.5 text-brand-950">
								Next
							</span>
						) : null}
					</span>
				</div>

				<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
					<span className="tabular-nums">
						{formatTimeRange(
							timeOf(meeting.time_start),
							timeOf(meeting.time_end),
						)}
					</span>
					{meeting.video_id && (
						<button
							type="button"
							onClick={() => onWatch(meeting)}
							className="relative z-10 flex items-center gap-1 rounded text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<PlayCircle size={13} aria-hidden /> Recording
						</button>
					)}
				</div>

				{meeting.has_homework && (
					<p className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-900">
						<NotebookPen size={13} className="mt-0.5 shrink-0" aria-hidden />
						<span className="line-clamp-2 min-w-0 break-words whitespace-pre-wrap">
							{meeting.text_homework || "There is homework for this meeting."}
						</span>
					</p>
				)}
			</div>
		</li>
	);
}
