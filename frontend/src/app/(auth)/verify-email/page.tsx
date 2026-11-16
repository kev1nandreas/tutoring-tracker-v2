import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailResult from "./_components/VerifyEmailResult";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
	return (
		<Suspense>
			<VerifyEmailResult />
		</Suspense>
	);
}
