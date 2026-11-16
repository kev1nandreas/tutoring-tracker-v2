import type { Metadata } from "next";
import SettingsView from "@/components/settings/SettingsView";
import PageTemplate from "@/layouts/template/PageTemplate";
import { PATH } from "@/shared/path";

export const metadata: Metadata = {
	title: "Settings",
	description: "Edit your profile and email notifications.",
};

export default function TutorSettingsPage() {
	return (
		<PageTemplate
			title="Settings"
			description="Your profile and email notifications."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{ name: "Settings", redirect: PATH.TUTOR_SETTINGS, isClickable: false },
			]}
		>
			<SettingsView />
		</PageTemplate>
	);
}
