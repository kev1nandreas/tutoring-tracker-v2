import type { Metadata } from "next";
import TutorialsView from "./_components/TutorialsView";

export const metadata: Metadata = {
	title: "Tutorials",
	description: "Create and manage your tutorials.",
};

export default function TutorialsPage() {
	return <TutorialsView />;
}
