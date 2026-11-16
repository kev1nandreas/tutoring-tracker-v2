import type { Metadata } from "next";
import { Suspense } from "react";
import GoogleRegisterForm from "./_components/GoogleRegisterForm";

export const metadata: Metadata = {
	title: "Finish signing up",
	description: "Add your school, phone and a username to create your account.",
};

export default function GoogleRegisterPage() {
	return (
		<Suspense>
			<GoogleRegisterForm />
		</Suspense>
	);
}
