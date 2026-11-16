import type { Metadata } from "next";
import NotificationsView from "@/components/notification/NotificationsView";

export const metadata: Metadata = {
	title: "Notifications",
	description: "Updates about your classes.",
};

export default function NotificationsPage() {
	return <NotificationsView />;
}
