import DashboardCard from "@/components/dashboard/DashboardCard";
import ItemRow from "@/components/dashboard/ItemRow";
import { formatDay } from "@/lib/helper";
import type { PendingAttachment } from "@/types/dashboard";

type Props = { items?: PendingAttachment[]; isLoading: boolean };

export default function PendingAttachmentsCard({
	items = [],
	isLoading,
}: Props) {
	return (
		<DashboardCard
			title="Meetings without attachments"
			description="Finished meetings that still need materials"
			count={items.length}
			isLoading={isLoading}
			isEmpty={items.length === 0}
			emptyText="All finished meetings have attachments."
		>
			<ul className="divide-y divide-gray-100">
				{items.map((a) => (
					<ItemRow
						key={a.meeting_id}
						title={a.title}
						subtitle={a.tutorial_name}
						aside={formatDay(a.date)}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
