import type { Metadata } from "next";
import EnrollView from "./_components/EnrollView";

export const metadata: Metadata = {
	title: "Join a class",
	description: "Ask to join a class with the code from your tutor.",
};

export default function EnrollPage() {
	return <EnrollView />;
}
