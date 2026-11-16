import DashboardCard from "@/components/dashboard/DashboardCard";
import ItemRow from "@/components/dashboard/ItemRow";
import { formatDay } from "@/lib/helper";
import type { PendingHomework } from "@/types/dashboard";

type Props = { items?: PendingHomework[]; isLoading: boolean };

export default function PendingHomeworkCard({ items = [], isLoading }: Props) {
	return (
		<DashboardCard
			title="Pending homework"
			count={items.length}
			isLoading={isLoading}
			isEmpty={items.length === 0}
			emptyText="No homework waiting. Nice work."
		>
			<ul className="divide-y divide-gray-100">
				{items.map((h) => (
					<ItemRow
						key={h.meeting_id}
						title={h.title}
						subtitle={h.text_homework || h.tutorial_name}
						aside={formatDay(h.date)}
						asideHint={h.tutorial_name}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
