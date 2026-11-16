import { formatDay } from "@/lib/helper";

/** Red "today" marker for meeting lists, drawn like the "now" line on the timetable. */
export default function TodayLine({ today }: { today: string }) {
	return (
		<li
			aria-label={`Today, ${formatDay(today)}`}
			className="flex items-center gap-2 py-1 text-xs font-medium text-[#c23a2b]"
		>
			<span className="h-2 w-2 shrink-0 rounded-full bg-[#c23a2b]" />
			<span className="h-[2px] flex-1 bg-[#c23a2b]" />
			<span>Today · {formatDay(today)}</span>
		</li>
	);
}
