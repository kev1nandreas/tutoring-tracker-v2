import type { Metadata } from "next";
import FeedbackView from "./_components/FeedbackView";

export const metadata: Metadata = {
	title: "Feedback",
	description: "Anonymous feedback from the students of a class.",
};

export default async function TutorialFeedbackPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <FeedbackView tutorialId={id} />;
}
