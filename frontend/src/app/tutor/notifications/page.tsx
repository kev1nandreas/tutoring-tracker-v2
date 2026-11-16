import type { Metadata } from "next";
import NotificationsView from "@/components/notification/NotificationsView";
import PageTemplate from "@/layouts/template/PageTemplate";
import { PATH } from "@/shared/path";

export const metadata: Metadata = {
	title: "Notifications",
	description: "Updates about your tutorials.",
};

export default function TutorNotificationsPage() {
	return (
		<PageTemplate
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{
					name: "Notifications",
					redirect: PATH.TUTOR_NOTIFICATIONS,
					isClickable: false,
				},
			]}
		>
			<NotificationsView />
		</PageTemplate>
	);
}
