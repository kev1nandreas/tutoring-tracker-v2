"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signOut } from "next-auth/react";
import * as React from "react";
import toast from "react-hot-toast";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import Typography from "@/components/Typography";
import { homeForRole, PATH } from "@/shared/path";

/**
 * Landing page after Google OAuth. Moves the backend token from the short-lived
 * NextAuth session into the app's normal session cookie, then ends the NextAuth session.
 */
export default function GoogleCallback() {
	const router = useRouter();
	const redirect = useSearchParams().get("redirect");
	const login = useAuthStore.useLogin();
	const [error, setError] = React.useState<string | null>(null);
	const started = React.useRef(false);

	React.useEffect(() => {
		if (started.current) return; // StrictMode runs effects twice
		started.current = true;

		(async () => {
			const session = await getSession();
			if (!session?.appToken || !session.appUser) {
				setError(session?.error || "Google sign-in did not complete.");
				return;
			}
			const { appToken, appUser } = session;
			login({ ...appUser, access_token: appToken });
			await signOut({ redirect: false });

			toast.success(`Welcome, ${appUser.name}!`);
			const safe =
				redirect?.startsWith("/") &&
				!redirect.startsWith("//") &&
				redirect !== "/"
					? redirect
					: null;
			router.replace(safe ?? homeForRole(appUser.role));
		})().catch(() => setError("Google sign-in failed. Please try again."));
	}, [login, redirect, router]);

	if (error) {
		return (
			<div role="alert" className="flex flex-col items-start gap-4">
				<Typography className="text-sm text-red-700">{error}</Typography>
				<Button variant="outline" onClick={() => router.replace(PATH.LOGIN)}>
					Back to sign in
				</Button>
			</div>
		);
	}

	return (
		<Typography aria-busy="true" className="text-[var(--ink-soft)]">
			Signing you in…
		</Typography>
	);
}
