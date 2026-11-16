import type { Metadata } from "next";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
	title: "Home",
	description: "Student home",
};

export default function StudentHomePage() {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-6">
			<Typography as="h1" weight="bold" className="text-2xl">
				Welcome
			</Typography>
			<Typography className="mt-1 text-gray-500">
				Your tutorials and meetings will show up here.
			</Typography>
		</div>
	);
}
