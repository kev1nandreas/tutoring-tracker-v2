import type { Metadata } from "next";
import PageTemplate from "@/layouts/template/PageTemplate";
import { PATH } from "@/shared/path";
import TutorDashboard from "./_components/TutorDashboard";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "Upcoming meetings, active tutorials and income.",
};

export default function TutorDashboardPage() {
	return (
		<PageTemplate
			title="Dashboard"
			description="Your meetings, tutorials and income at a glance."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: false },
			]}
		>
			<TutorDashboard />
		</PageTemplate>
	);
}
