import DashboardCard from "@/components/dashboard/DashboardCard";
import TutorialRow from "@/components/dashboard/TutorialRow";
import ViewAllLink from "@/components/dashboard/ViewAllLink";
import { PATH } from "@/shared/path";
import type { TutorialItem } from "@/types/dashboard";

type Props = { tutorials?: TutorialItem[]; isLoading: boolean };

export default function ActiveTutorialsCard({
	tutorials = [],
	isLoading,
}: Props) {
	return (
		<DashboardCard
			title="Active tutorials"
			count={tutorials.length}
			isLoading={isLoading}
			isEmpty={tutorials.length === 0}
			emptyText="No active tutorials."
			action={<ViewAllLink href={PATH.TUTORIALS} />}
		>
			<ul className="divide-y divide-gray-100">
				{tutorials.map((t) => (
					<TutorialRow
						key={t.id}
						tutorial={t}
						meta={`${t.students} ${t.students === 1 ? "student" : "students"}`}
						showProgress
						href={`${PATH.TUTORIALS}/${t.id}`}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
