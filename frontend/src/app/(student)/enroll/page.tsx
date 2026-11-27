import type { Metadata } from "next";
import EnrollView from "./_components/EnrollView";

export const metadata: Metadata = {
	title: "Join a class",
	description: "Ask to join a class with the code from your tutor.",
};

export default async function EnrollPage({
	searchParams,
}: {
	searchParams: Promise<{ code?: string }>;
}) {
	const { code } = await searchParams;
	// a link such as a dashboard row can fill the code in
	const initialCode = (code ?? "").trim().toUpperCase().slice(0, 6);
	return <EnrollView initialCode={initialCode} />;
}
