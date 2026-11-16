import { todayISO } from "@/lib/helper";
import type { Tutorial } from "@/types/tutorial";

export type TutorialStatusKey = "upcoming" | "active" | "done";

const STYLE: Record<
	TutorialStatusKey,
	{ label: string; badge: string; accent: string }
> = {
	upcoming: {
		label: "Upcoming",
		badge: "bg-amber-50 text-amber-700",
		accent: "bg-amber-400",
	},
	active: {
		label: "Active",
		badge: "bg-green-50 text-green-700",
		accent: "bg-green-500",
	},
	done: {
		label: "Done",
		badge: "bg-gray-100 text-gray-600",
		accent: "bg-gray-300",
	},
};

const dayNumber = (iso: string) =>
	Math.floor(new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime() / 86400000);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function tutorialStatus(t: Tutorial) {
	const today = todayISO();
	const key: TutorialStatusKey = t.is_done
		? "done"
		: t.date_started.slice(0, 10) > today
			? "upcoming"
			: "active";

	let hint = "";
	if (key === "upcoming") {
		hint = `Starts in ${plural(dayNumber(t.date_started) - dayNumber(today), "day")}`;
	} else if (key === "active") {
		const left = dayNumber(t.date_ended) - dayNumber(today);
		hint =
			left > 0
				? `${plural(left, "day")} left`
				: left === 0
					? "Ends today"
					: "Past its end date";
	}
	return { key, hint, ...STYLE[key] };
}

export default function TutorialStatusBadge({
	tutorial,
}: {
	tutorial: Tutorial;
}) {
	const { label, badge } = tutorialStatus(tutorial);
	return (
		<span
			className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
		>
			{label}
		</span>
	);
}
