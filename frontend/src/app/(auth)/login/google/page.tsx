import type { Metadata } from "next";
import { Suspense } from "react";
import GoogleCallback from "./_components/GoogleCallback";

export const metadata: Metadata = { title: "Signing in" };

export default function GoogleLoginPage() {
	return (
		<Suspense>
			<GoogleCallback />
		</Suspense>
	);
}
