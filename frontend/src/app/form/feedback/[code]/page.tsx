import type { Metadata } from "next";
import FeedbackForm from "./_components/FeedbackForm";

export const metadata: Metadata = {
	title: "Class feedback",
	description: "Tell your tutor how the class went. Anonymous.",
};

export default async function FeedbackPage({
	params,
	searchParams,
}: {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ from?: string }>;
}) {
	const { code } = await params;
	const { from } = await searchParams;
	return <FeedbackForm code={code} from={from} />;
}
