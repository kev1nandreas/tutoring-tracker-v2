import type { Metadata } from "next";
import SettingsView from "@/components/settings/SettingsView";

export const metadata: Metadata = {
	title: "Settings",
	description: "Edit your profile and email notifications.",
};

export default function SettingsPage() {
	return <SettingsView />;
}
