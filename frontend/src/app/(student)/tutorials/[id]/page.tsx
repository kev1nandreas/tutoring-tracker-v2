import type { Metadata } from "next";
import MyTutorialDetail from "./_components/MyTutorialDetail";

export const metadata: Metadata = {
	title: "Tutorial",
	description: "Your class, its meetings and homework.",
};

export default async function MyTutorialDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <MyTutorialDetail id={id} />;
}
