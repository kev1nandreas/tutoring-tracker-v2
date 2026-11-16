import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import Typography from "@/components/Typography";
import { formatShortDate } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { Tutorial } from "@/types/tutorial";
import TutorialStatusBadge, { tutorialStatus } from "./TutorialStatusBadge";

export default function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
	const { accent, hint } = tutorialStatus(tutorial);

	return (
		<Link
			href={`${PATH.TUTORIALS}/${tutorial.id}`}
			className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 pl-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
		>
			<span
				aria-hidden
				className={`absolute inset-y-0 left-0 w-1.5 ${accent}`}
			/>

			<div className="flex items-start justify-between gap-3">
				<span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
					{tutorial.custom_id}
				</span>
				<TutorialStatusBadge tutorial={tutorial} />
			</div>

			<div>
				<Typography
					as="h2"
					weight="semibold"
					className="line-clamp-1 text-lg text-gray-900 group-hover:text-brand-700"
				>
					{tutorial.name}
				</Typography>
				<Typography className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-gray-600">
					{tutorial.description || "No description."}
				</Typography>
			</div>

			<div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs">
				<span className="flex items-center gap-1.5 text-gray-500">
					<CalendarDays size={14} aria-hidden />
					{formatShortDate(tutorial.date_started)} –{" "}
					{formatShortDate(tutorial.date_ended)}
				</span>
				<span className="flex items-center gap-0.5 font-medium text-brand-700">
					{hint}
					<ChevronRight
						size={14}
						aria-hidden
						className="transition-transform group-hover:translate-x-0.5"
					/>
				</span>
			</div>
		</Link>
	);
}
