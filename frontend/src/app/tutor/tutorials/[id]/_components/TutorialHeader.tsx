import { CalendarDays } from "lucide-react";
import ProgressBar from "@/components/dashboard/ProgressBar";
import Typography from "@/components/Typography";
import { formatShortDate } from "@/lib/helper";
import type { Tutorial } from "@/types/tutorial";
import TutorialStatusBadge, {
	tutorialStatus,
} from "../../_components/TutorialStatusBadge";

type Props = {
	tutorial: Tutorial;
	totalMeetings: number;
	doneMeetings: number;
	homeworkMeetings: number;
	/** Top-right slot, e.g. edit and delete buttons. */
	actions?: React.ReactNode;
};

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border border-[#d8e0f0] bg-white px-4 py-2.5">
			<dd className="text-xl font-bold tabular-nums text-brand-950">{value}</dd>
			<dt className="text-xs text-gray-500">{label}</dt>
		</div>
	);
}

/** Graph-paper header: what this tutorial is, how far along it is, and key numbers. */
export default function TutorialHeader({
	tutorial,
	totalMeetings,
	doneMeetings,
	homeworkMeetings,
	actions,
}: Props) {
	const { accent, hint } = tutorialStatus(tutorial);

	return (
		<header className="bg-graph relative overflow-hidden rounded-xl border border-[#d8e0f0] px-6 py-6 pl-8 sm:px-8 sm:pl-9">
			<span
				aria-hidden
				className={`absolute inset-y-0 left-0 w-1.5 ${accent}`}
			/>

			{/* decorative accent, fading into the paper toward the text */}
			{/* biome-ignore lint/performance/noImgElement: static decorative art */}
			<img
				src="/images/tutorial-accent.png"
				alt=""
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-0 hidden h-[125%] max-w-[46%] -translate-y-1/2 select-none object-contain object-right opacity-20 [mask-image:linear-gradient(to_right,transparent,black_55%)] sm:block"
			/>

			<div className="relative z-10">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-wrap items-center gap-3">
						<span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-[#d8e0f0]">
							{tutorial.custom_id}
						</span>
						<TutorialStatusBadge tutorial={tutorial} />
						{hint && (
							<span className="text-xs font-medium text-brand-700">{hint}</span>
						)}
					</div>
					{actions}
				</div>

				<Typography
					as="h1"
					weight="bold"
					className="mt-3 max-w-2xl text-2xl leading-tight break-words text-brand-950 sm:text-3xl"
				>
					{tutorial.name}
				</Typography>

				<Typography className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">
					{tutorial.description || "No description."}
				</Typography>

				<div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-end">
					<dl className="grid grid-cols-3 gap-3 sm:w-fit">
						<Stat label="Meetings" value={totalMeetings} />
						<Stat label="Done" value={doneMeetings} />
						<Stat label="With homework" value={homeworkMeetings} />
					</dl>

					<div className="lg:ml-auto lg:w-full lg:max-w-xs">
						<div className="mb-2 flex items-center gap-2 text-sm text-gray-700 lg:justify-end">
							<CalendarDays size={16} aria-hidden />
							{formatShortDate(tutorial.date_started)} –{" "}
							{formatShortDate(tutorial.date_ended)}
						</div>
						<ProgressBar
							value={doneMeetings}
							max={totalMeetings}
							label={
								totalMeetings === 0
									? "No meetings yet"
									: `${doneMeetings} of ${totalMeetings} meetings done`
							}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
