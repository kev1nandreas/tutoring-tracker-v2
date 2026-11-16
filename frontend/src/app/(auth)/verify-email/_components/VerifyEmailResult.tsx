"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import Typography from "@/components/Typography";
import { verifyEmail } from "@/services/api/main/settings";
import { homeForRole, PATH, settingsPath } from "@/shared/path";

/** Opened from the emailed link: confirms the token once, then says what happened. */
export default function VerifyEmailResult() {
	const token = useSearchParams().get("token") ?? "";
	const user = useAuthStore.useUser();
	// Plain state, not useMutation: in dev, StrictMode detaches a mutation's observer
	// between its two effect runs, and the result would never reach this component.
	const [state, setState] = React.useState<
		| { status: "loading" }
		| { status: "done" }
		| { status: "error"; message: string }
	>({ status: "loading" });
	const started = React.useRef(false);

	React.useEffect(() => {
		if (started.current || !token) return; // StrictMode runs effects twice
		started.current = true;
		verifyEmail(token)
			.then(() => setState({ status: "done" }))
			.catch((e: unknown) =>
				setState({
					status: "error",
					message: e instanceof Error ? e.message : "",
				}),
			);
	}, [token]);

	const isSuccess = state.status === "done";
	const isError = state.status === "error";
	const error = state.status === "error" ? state : undefined;

	const failed = !token || isError;

	return (
		<output aria-live="polite" className="flex flex-col items-start gap-4">
			{isSuccess && (
				<CheckCircle2 className="text-green-600" size={40} aria-hidden />
			)}
			{failed && <XCircle className="text-red-600" size={40} aria-hidden />}

			<Typography
				as="h1"
				className="auth-display text-[2rem] leading-tight"
				weight="bold"
			>
				{isSuccess
					? "Email verified"
					: failed
						? "Link not valid"
						: "Verifying your email…"}
			</Typography>
			<Typography className="text-[var(--ink-soft)]">
				{isSuccess
					? "Thanks! You can now turn on email notifications in your settings."
					: failed
						? error?.message ||
							"This verification link is invalid or has expired. Request a new one from your settings."
						: "One moment."}
			</Typography>

			{(isSuccess || failed) && (
				<Link
					href={user ? settingsPath(user.role) : PATH.LOGIN}
					className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					{user ? "Go to settings" : "Sign in"}
				</Link>
			)}
			{user && (
				<Link
					href={homeForRole(user.role)}
					className="text-sm font-medium text-brand-700 hover:underline"
				>
					Back to home
				</Link>
			)}
		</output>
	);
}
