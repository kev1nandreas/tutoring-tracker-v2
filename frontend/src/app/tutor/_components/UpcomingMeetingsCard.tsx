import DashboardCard from "@/components/dashboard/DashboardCard";
import ItemRow from "@/components/dashboard/ItemRow";
import ViewAllLink from "@/components/dashboard/ViewAllLink";
import { formatDay, formatTimeRange } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { MeetingItem } from "@/types/dashboard";

type Props = { meetings?: MeetingItem[]; isLoading: boolean };

export default function UpcomingMeetingsCard({
	meetings = [],
	isLoading,
}: Props) {
	return (
		<DashboardCard
			title="Upcoming meetings"
			count={meetings.length}
			isLoading={isLoading}
			isEmpty={meetings.length === 0}
			emptyText="No meetings scheduled. Add one to a tutorial."
			action={<ViewAllLink href={PATH.TUTORIALS}>Tutorials</ViewAllLink>}
		>
			<ul className="divide-y divide-gray-100">
				{meetings.map((m) => (
					<ItemRow
						key={m.id}
						title={m.title}
						subtitle={m.tutorial_name}
						aside={formatDay(m.date)}
						asideHint={formatTimeRange(m.time_start, m.time_end)}
						href={`${PATH.TUTORIALS}/${m.tutorial_id}`}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
