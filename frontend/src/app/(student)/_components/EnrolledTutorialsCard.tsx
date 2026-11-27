import DashboardCard from "@/components/dashboard/DashboardCard";
import TutorialRow from "@/components/dashboard/TutorialRow";
import ViewAllLink from "@/components/dashboard/ViewAllLink";
import { PATH } from "@/shared/path";
import type { TutorialItem } from "@/types/dashboard";

type Props = { tutorials?: TutorialItem[]; isLoading: boolean };

export default function EnrolledTutorialsCard({
	tutorials = [],
	isLoading,
}: Props) {
	return (
		<DashboardCard
			title="My active tutorials"
			count={tutorials.length}
			isLoading={isLoading}
			isEmpty={tutorials.length === 0}
			emptyText="You are not enrolled in an active tutorial yet."
			action={<ViewAllLink href={PATH.STUDENT_TUTORIALS} />}
			emptyAction={<ViewAllLink href={PATH.ENROLL}>Join a class</ViewAllLink>}
		>
			<ul className="divide-y divide-gray-100">
				{tutorials.map((t) => (
					<TutorialRow
						key={t.id}
						tutorial={t}
						showProgress
						href={`${PATH.STUDENT_TUTORIALS}/${t.id}`}
					/>
				))}
			</ul>
		</DashboardCard>
	);
}
