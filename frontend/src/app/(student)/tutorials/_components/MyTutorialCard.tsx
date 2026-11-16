import { CalendarDays, User } from "lucide-react";
import ProgressBar from "@/components/dashboard/ProgressBar";
import Typography from "@/components/Typography";
import { formatDay, formatShortDate, todayISO } from "@/lib/helper";
import type { EnrolledTutorial } from "@/types/student-tutorial";

function statusOf(t: EnrolledTutorial) {
	if (t.is_done)
		return {
			label: "Finished",
			badge: "bg-gray-100 text-gray-600",
			accent: "bg-gray-300",
		};
	if (t.date_started > todayISO())
		return {
			label: "Upcoming",
			badge: "bg-amber-50 text-amber-700",
			accent: "bg-amber-400",
		};
	return {
		label: "Active",
		badge: "bg-green-50 text-green-700",
		accent: "bg-green-500",
	};
}

export default function MyTutorialCard({
	tutorial,
}: {
	tutorial: EnrolledTutorial;
}) {
	const status = statusOf(tutorial);

	return (
		<article className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 pl-6">
			<span
				aria-hidden
				className={`absolute inset-y-0 left-0 w-1.5 ${status.accent}`}
			/>

			<div className="flex items-start justify-between gap-3">
				<span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
					{tutorial.custom_id}
				</span>
				<span
					className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badge}`}
				>
					{status.label}
				</span>
			</div>

			<div>
				<Typography
					as="h2"
					weight="semibold"
					className="line-clamp-1 text-lg text-gray-900"
				>
					{tutorial.name}
				</Typography>
				{tutorial.tutor_name && (
					<p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
						<User size={12} aria-hidden /> {tutorial.tutor_name}
					</p>
				)}
				<Typography className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-600">
					{tutorial.description || "No description."}
				</Typography>
			</div>

			<ProgressBar
				value={tutorial.done_meetings}
				max={tutorial.total_meetings}
				label={
					tutorial.total_meetings === 0
						? "No meetings scheduled yet"
						: `${tutorial.done_meetings} of ${tutorial.total_meetings} meetings done`
				}
			/>

			<div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs">
				<span className="flex items-center gap-1.5 text-gray-500">
					<CalendarDays size={14} aria-hidden />
					{formatShortDate(tutorial.date_started)} –{" "}
					{formatShortDate(tutorial.date_ended)}
				</span>
				{!tutorial.is_done && tutorial.next_meeting_date && (
					<span className="font-medium text-brand-700">
						Next: {formatDay(tutorial.next_meeting_date)}
					</span>
				)}
			</div>
		</article>
	);
}
