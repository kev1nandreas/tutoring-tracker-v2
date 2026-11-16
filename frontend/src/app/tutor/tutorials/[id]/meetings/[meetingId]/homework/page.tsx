import type { Metadata } from "next";
import HomeworkView from "./_components/HomeworkView";

export const metadata: Metadata = {
	title: "Homework",
	description: "Submissions and grades for a meeting's homework.",
};

export default async function HomeworkPage({
	params,
}: {
	params: Promise<{ id: string; meetingId: string }>;
}) {
	const { id, meetingId } = await params;
	return <HomeworkView tutorialId={id} meetingId={meetingId} />;
}
