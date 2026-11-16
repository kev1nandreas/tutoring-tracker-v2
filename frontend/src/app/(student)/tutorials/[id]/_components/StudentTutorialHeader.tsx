import { CalendarDays, User } from "lucide-react";
import ProgressBar from "@/components/dashboard/ProgressBar";
import Typography from "@/components/Typography";
import { formatShortDate } from "@/lib/helper";
import type { StudentMeeting } from "@/types/student-meeting";
import type { EnrolledTutorial } from "@/types/student-tutorial";
import { enrolledStatus } from "../../_components/enrolledStatus";

type Props = { tutorial: EnrolledTutorial; meetings?: StudentMeeting[] };

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="min-w-0 rounded-lg border border-[#d8e0f0] bg-white px-3 py-2.5 sm:px-4">
			<dd className="text-xl font-bold tabular-nums text-brand-950">{value}</dd>
			<dt className="text-xs text-gray-500">{label}</dt>
		</div>
	);
}

/** Graph-paper header: the class, who teaches it and how far along it is. Read-only. */
export default function StudentTutorialHeader({ tutorial, meetings }: Props) {
	const status = enrolledStatus(tutorial);
	// counts come from the tutorial itself; homework comes from the meetings once loaded
	const homework = meetings?.filter((m) => m.has_homework).length ?? 0;

	return (
		<header className="bg-graph relative overflow-hidden rounded-xl border border-[#d8e0f0] px-6 py-6 pl-8 sm:px-8 sm:pl-9">
			<span
				aria-hidden
				className={`absolute inset-y-0 left-0 w-1.5 ${status.accent}`}
			/>
			{/* decorative accent, fading into the paper toward the text */}
			{/* biome-ignore lint/performance/noImgElement: static decorative art */}
			<img
				src="/images/tutorial-accent.png"
				alt=""
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-0 hidden h-[125%] max-w-[46%] -translate-y-1/2 select-none object-contain object-right opacity-40 [mask-image:linear-gradient(to_right,transparent,black_55%)] sm:block"
			/>

			<div className="relative z-10">
				<div className="flex flex-wrap items-center gap-3">
					<span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-[#d8e0f0]">
						{tutorial.custom_id}
					</span>
					<span
						className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badge}`}
					>
						{status.label}
					</span>
					{status.hint && (
						<span className="text-xs font-medium text-brand-700">
							{status.hint}
						</span>
					)}
				</div>

				<Typography
					as="h1"
					weight="bold"
					className="mt-3 max-w-2xl text-2xl leading-tight break-words text-brand-950 sm:text-3xl"
				>
					{tutorial.name}
				</Typography>

				<Typography className="mt-2 max-w-md text-sm leading-relaxed break-words text-gray-700">
					{tutorial.description || "No description."}
				</Typography>

				<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-700">
					{tutorial.tutor_name && (
						<span className="flex items-center gap-2">
							<User size={16} aria-hidden /> {tutorial.tutor_name}
						</span>
					)}
					<span className="flex items-center gap-2">
						<CalendarDays size={16} aria-hidden />
						{formatShortDate(tutorial.date_started)} –{" "}
						{formatShortDate(tutorial.date_ended)}
					</span>
				</div>

				<div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-end">
					<dl className="grid min-w-0 grid-cols-3 gap-2 sm:w-fit sm:gap-3">
						<Stat label="Meetings" value={tutorial.total_meetings} />
						<Stat label="Done" value={tutorial.done_meetings} />
						<Stat label="With homework" value={homework} />
					</dl>
					<div className="lg:ml-auto lg:w-full lg:max-w-xs">
						<ProgressBar
							value={tutorial.done_meetings}
							max={tutorial.total_meetings}
							label={
								tutorial.total_meetings === 0
									? "No meetings yet"
									: `${tutorial.done_meetings} of ${tutorial.total_meetings} meetings done`
							}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
