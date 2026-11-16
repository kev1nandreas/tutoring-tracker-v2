"use client";

import { signIn } from "next-auth/react";
import * as React from "react";
import Button from "@/components/button/Button";
import { PATH } from "@/shared/path";

/** Starts the Google OAuth flow; `/login/google` finishes the sign-in. */
export default function GoogleSignInButton({
	redirect,
}: {
	/** Same-site path to open after signing in. */
	redirect?: string | null;
}) {
	const [loading, setLoading] = React.useState(false);

	const handleClick = () => {
		setLoading(true);
		const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
		signIn("google", { callbackUrl: `${PATH.LOGIN_GOOGLE}${query}` });
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="lg"
			isLoading={loading}
			onClick={handleClick}
			className="w-full"
		>
			<svg
				role="img"
				aria-label="Google"
				viewBox="0 0 48 48"
				className="mr-2 h-5 w-5"
			>
				<path
					fill="#EA4335"
					d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
				/>
				<path
					fill="#4285F4"
					d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
				/>
				<path
					fill="#FBBC05"
					d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
				/>
				<path
					fill="#34A853"
					d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
				/>
			</svg>
			Continue with Google
		</Button>
	);
}
