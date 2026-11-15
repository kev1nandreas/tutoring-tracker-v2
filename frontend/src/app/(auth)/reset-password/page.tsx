import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./_components/ResetPasswordForm";

export const metadata: Metadata = {
	title: "Reset Password",
	description: "Reset your account password",
};

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
