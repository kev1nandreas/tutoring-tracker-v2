import { todayISO } from "@/lib/helper";
import type { EnrolledTutorial } from "@/types/student-tutorial";

const dayNumber = (iso: string) =>
	Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Status of one of the student's tutorials: badge colours, accent strip and a short time hint. */
export function enrolledStatus(t: EnrolledTutorial) {
	const today = todayISO();

	if (t.is_done) {
		return {
			key: "done",
			label: "Finished",
			badge: "bg-gray-100 text-gray-600",
			accent: "bg-gray-300",
			hint: "",
		} as const;
	}
	if (t.date_started > today) {
		const days = dayNumber(t.date_started) - dayNumber(today);
		return {
			key: "upcoming",
			label: "Upcoming",
			badge: "bg-amber-50 text-amber-700",
			accent: "bg-amber-400",
			hint: `Starts in ${plural(days, "day")}`,
		} as const;
	}
	const left = dayNumber(t.date_ended) - dayNumber(today);
	return {
		key: "active",
		label: "Active",
		badge: "bg-green-50 text-green-700",
		accent: "bg-green-500",
		hint:
			left > 0 ? `${plural(left, "day")} left` : left === 0 ? "Ends today" : "",
	} as const;
}
