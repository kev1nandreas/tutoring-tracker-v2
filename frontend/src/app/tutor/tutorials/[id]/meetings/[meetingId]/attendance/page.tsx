import type { Metadata } from "next";
import AttendanceView from "./_components/AttendanceView";

export const metadata: Metadata = {
	title: "Attendance",
	description: "Who checked in to a meeting, with their photos.",
};

export default async function AttendancePage({
	params,
}: {
	params: Promise<{ id: string; meetingId: string }>;
}) {
	const { id, meetingId } = await params;
	return <AttendanceView tutorialId={id} meetingId={meetingId} />;
}
