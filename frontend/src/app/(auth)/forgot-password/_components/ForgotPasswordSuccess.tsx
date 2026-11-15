import { MailCheck } from "lucide-react";
import Button from "@/components/button/Button";
import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";

export default function ForgotPasswordSuccess({ email }: { email: string }) {
	return (
		<div className="rounded-2xl bg-white p-10 text-center shadow-xl">
			<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
				<MailCheck className="h-7 w-7 text-brand-700" />
			</div>

			<Typography as="h1" className="mt-6 text-3xl" weight="bold">
				Check Your Email
			</Typography>
			<Typography className="mt-2 text-gray-500">
				We&apos;ve sent a password reset link to{" "}
				<span className="font-semibold text-gray-900">{email}</span>. Please
				check your inbox and follow the instructions.
			</Typography>

			<PrimaryLink href={PATH.LOGIN} underline={false} className="mt-8 w-full">
				<Button variant="brand" size="lg" className="w-full">
					Back to Login
				</Button>
			</PrimaryLink>
		</div>
	);
}
