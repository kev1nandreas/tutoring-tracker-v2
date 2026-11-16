import { CalendarDays, Clock } from "lucide-react";
import Typography from "@/components/Typography";
import { formatTimeRange, timeOf } from "@/lib/helper";
import type { Meeting } from "@/types/meeting";

type Props = {
	meeting: Meeting;
	enrolled: number;
	submitted: number;
	graded: number;
	average: number | null;
};

const longDate = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(`${iso.slice(0, 10)}T00:00:00`));

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-[#d8e0f0] bg-white px-4 py-2.5">
			<dd className="text-xl font-bold tabular-nums text-brand-950">{value}</dd>
			<dt className="text-xs text-gray-500">{label}</dt>
		</div>
	);
}

/** Graph-paper header: which meeting this homework belongs to, and how grading is going. */
export default function HomeworkHeader({
	meeting,
	enrolled,
	submitted,
	graded,
	average,
}: Props) {
	return (
		<header className="bg-graph relative overflow-hidden rounded-xl border border-[#d8e0f0] px-6 py-6 pl-8 sm:px-8 sm:pl-9">
			<span
				aria-hidden
				className="absolute inset-y-0 left-0 w-1.5 bg-brand-600"
			/>

			<p className="text-xs font-medium text-brand-700">Homework</p>
			<Typography
				as="h1"
				weight="bold"
				className="mt-1 text-3xl leading-tight text-brand-950"
			>
				{meeting.title}
			</Typography>

			<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-700">
				<span className="flex items-center gap-2">
					<CalendarDays size={16} aria-hidden /> {longDate(meeting.date)}
				</span>
				<span className="flex items-center gap-2 tabular-nums">
					<Clock size={16} aria-hidden />
					{formatTimeRange(
						timeOf(meeting.time_start),
						timeOf(meeting.time_end),
					) || "No time set"}
				</span>
			</div>

			<dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Stat label="Submitted" value={`${submitted}/${enrolled}`} />
				<Stat label="Graded" value={`${graded}/${submitted}`} />
				<Stat
					label="Average grade"
					value={average === null ? "–" : String(average)}
				/>
				<Stat
					label="Not submitted"
					value={String(Math.max(enrolled - submitted, 0))}
				/>
			</dl>
		</header>
	);
}
