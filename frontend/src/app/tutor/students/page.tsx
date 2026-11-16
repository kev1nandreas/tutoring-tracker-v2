import type { Metadata } from "next";
import StudentsView from "./_components/StudentsView";

export const metadata: Metadata = {
	title: "Students",
	description: "Every student across all your tutorials.",
};

export default function StudentsPage() {
	return <StudentsView />;
}
