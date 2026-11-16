import type { Metadata } from "next";
import Link from "next/link";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";
import StudentDashboard from "./_components/StudentDashboard";

export const metadata: Metadata = {
	title: "Home",
	description: "Pending homework and your tutorials.",
};

export default function StudentHomePage() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
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
				<Link
					href={PATH.ENROLL}
					className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
				>
					Join a class
				</Link>
			</div>
			<StudentDashboard />
		</div>
	);
}
