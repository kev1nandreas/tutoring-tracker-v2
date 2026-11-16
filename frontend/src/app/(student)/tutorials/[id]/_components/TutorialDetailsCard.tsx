import { formatShortDate } from "@/lib/helper";
import type { EnrolledTutorial } from "@/types/student-tutorial";

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4">
			<dt className="text-gray-500">{label}</dt>
			<dd className="text-right font-medium text-gray-900">{value}</dd>
		</div>
	);
}

/** Plain facts about the class. No settings: those belong to the tutor. */
export default function TutorialDetailsCard({
	tutorial,
}: {
	tutorial: EnrolledTutorial;
}) {
	return (
		<aside className="rounded-xl border border-gray-200 bg-white ">
			<h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
				Class details
			</h2>
			<dl className="flex flex-col gap-3 px-5 py-4 text-sm">
				<Row label="Code" value={tutorial.custom_id} />
				{tutorial.tutor_name && (
					<Row label="Tutor" value={tutorial.tutor_name} />
				)}
				<Row label="Starts" value={formatShortDate(tutorial.date_started)} />
				<Row label="Ends" value={formatShortDate(tutorial.date_ended)} />
				<Row label="Meetings" value={String(tutorial.total_meetings)} />
				{tutorial.next_meeting_date && !tutorial.is_done && (
					<Row
						label="Next meeting"
						value={formatShortDate(tutorial.next_meeting_date)}
					/>
				)}
			</dl>
		</aside>
	);
}
