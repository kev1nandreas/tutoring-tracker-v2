import DashboardCard from "@/components/dashboard/DashboardCard";
import TutorialRow from "@/components/dashboard/TutorialRow";
import ViewAllLink from "@/components/dashboard/ViewAllLink";
import { formatDay } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { TutorialItem } from "@/types/dashboard";

type Props = { tutorials?: TutorialItem[]; isLoading: boolean };

const EnrolledBadge = () => (
	<span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
		Enrolled
	</span>
);

export default function UpcomingTutorialsCard({
	tutorials = [],
	isLoading,
}: Props) {
	return (
		<DashboardCard
			title="Upcoming tutorials"
			description="Tutorials that have not started yet"
			count={tutorials.length}
			isLoading={isLoading}
			isEmpty={tutorials.length === 0}
			emptyText="No upcoming tutorials."
			action={<ViewAllLink href={PATH.ENROLL}>Join a class</ViewAllLink>}
		>
			<ul className="divide-y divide-gray-100">
				{tutorials.map((t) => (
					<TutorialRow
						key={t.id}
						tutorial={t}
						meta={`starts ${formatDay(t.date_started)}`}
						trailing={t.is_enrolled ? <EnrolledBadge /> : undefined}
						// enrolled: open the class; not yet: ask to join with its code filled in
						href={
							t.is_enrolled
								? `${PATH.STUDENT_TUTORIALS}/${t.id}`
								: `${PATH.ENROLL}?code=${encodeURIComponent(t.custom_id)}`
						}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
