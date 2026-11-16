import type { Metadata } from "next";
import Typography from "@/components/Typography";
import StudentDashboard from "./_components/StudentDashboard";

export const metadata: Metadata = {
	title: "Home",
	description: "Pending homework and your tutorials.",
};

export default function StudentHomePage() {
	return (
		<div className="flex flex-col gap-5">
			<div>
				<Typography
					as="h1"
					weight="semibold"
					className="text-2xl text-gray-900"
				>
					Home
				</Typography>
				<Typography className="text-sm text-gray-500">
					What is due and what is coming up.
				</Typography>
			</div>
			<StudentDashboard />
		</div>
	);
}
