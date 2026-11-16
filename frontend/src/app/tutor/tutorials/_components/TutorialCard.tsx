import { CalendarDays } from "lucide-react";
import Typography from "@/components/Typography";
import { formatShortDate } from "@/lib/helper";
import type { Tutorial } from "@/types/tutorial";

type Status = { label: string; className: string };

function statusOf(t: Tutorial): Status {
	if (t.is_done)
		return { label: "Done", className: "bg-gray-100 text-gray-600" };

	const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
	if (t.date_started.slice(0, 10) > today) {
		return { label: "Upcoming", className: "bg-amber-50 text-amber-700" };
	}
	return { label: "Active", className: "bg-green-50 text-green-700" };
}

export default function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
	const status = statusOf(tutorial);

	return (
		<article className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<Typography
						as="h2"
						weight="semibold"
						className="truncate text-base text-gray-900"
					>
						{tutorial.name}
					</Typography>
					<Typography className="text-xs text-gray-500">
						{tutorial.custom_id}
					</Typography>
				</div>
				<span
					className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
				>
					{status.label}
				</span>
			</div>

			<Typography className="line-clamp-2 min-h-10 text-sm text-gray-600">
				{tutorial.description || "No description."}
			</Typography>

			<div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
				<CalendarDays size={14} aria-hidden />
				<span>
					{formatShortDate(tutorial.date_started)} –{" "}
					{formatShortDate(tutorial.date_ended)}
				</span>
			</div>
		</article>
	);
}
