import type { Metadata } from "next";
import TutorialDetail from "./_components/TutorialDetail";

export const metadata: Metadata = {
	title: "Tutorial",
	description: "Tutorial details and meetings.",
};

export default async function TutorialDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <TutorialDetail id={id} />;
}
