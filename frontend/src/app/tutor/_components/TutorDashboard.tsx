"use client";

import DashboardError from "@/components/dashboard/DashboardError";
import { useTutorDashboard } from "../_hooks/useTutorDashboard";
import ActiveTutorialsCard from "./ActiveTutorialsCard";
import IncomeCard from "./IncomeCard";
import PendingAttachmentsCard from "./PendingAttachmentsCard";
import UpcomingMeetingsCard from "./UpcomingMeetingsCard";

export default function TutorDashboard() {
	const { data, isLoading, isError, error, refetch } = useTutorDashboard();

	if (isError) {
		return <DashboardError message={error.message} onRetry={() => refetch()} />;
	}

	return (
		<div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
			<div className="min-w-0 lg:col-span-2">
				<IncomeCard income={data?.income} isLoading={isLoading} />
			</div>
			<UpcomingMeetingsCard
				meetings={data?.upcoming_meetings}
				isLoading={isLoading}
			/>
			<ActiveTutorialsCard
				tutorials={data?.active_tutorials}
				isLoading={isLoading}
			/>
			<div className="min-w-0 lg:col-span-2">
				<PendingAttachmentsCard
					items={data?.pending_attachments}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
