import type { Metadata } from "next";
import { Suspense } from "react";
import CompleteProfileGuard from "./_components/CompleteProfileGuard";

export const metadata: Metadata = {
	title: "Finish your account",
	description: "Add the details Google does not provide.",
};

export default function CompleteProfilePage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
			<Suspense>
				<CompleteProfileGuard />
			</Suspense>
		</main>
	);
}
