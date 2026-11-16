"use client";

import DashboardError from "@/components/dashboard/DashboardError";
import { useStudentDashboard } from "../_hooks/useStudentDashboard";
import EnrolledTutorialsCard from "./EnrolledTutorialsCard";
import PendingHomeworkCard from "./PendingHomeworkCard";
import UpcomingTutorialsCard from "./UpcomingTutorialsCard";

export default function StudentDashboard() {
	const { data, isLoading, isError, error, refetch } = useStudentDashboard();

	if (isError) {
		return <DashboardError message={error.message} onRetry={() => refetch()} />;
	}

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<div className="lg:col-span-2">
				<PendingHomeworkCard
					items={data?.pending_homework}
					isLoading={isLoading}
				/>
			</div>
			<EnrolledTutorialsCard
				tutorials={data?.enrolled_tutorials}
				isLoading={isLoading}
			/>
			<UpcomingTutorialsCard
				tutorials={data?.upcoming_tutorials}
				isLoading={isLoading}
			/>
		</div>
	);
}
