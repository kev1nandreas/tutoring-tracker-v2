"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/useSettings";
import { settingsPath } from "@/shared/path";

/**
 * Reminds a Google sign-up that has no password yet to set one. Shown on every page of
 * the student and tutor areas except Settings itself, until a password is set.
 */
export default function PasswordReminder() {
	const { data: me } = useMe();
	const pathname = usePathname();
	const settings = settingsPath(me?.role);

	if (!me || me.has_password !== false || pathname === settings) return null;

	return (
		<section
			aria-label="Password reminder"
			className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
		>
			<p className="flex items-start gap-2">
				<KeyRound size={18} className="mt-0.5 shrink-0" aria-hidden />
				<span>
					<span className="font-semibold">Set a password.</span> You signed up
					with Google, so right now you can only sign in with Google.
				</span>
			</p>
			<Link
				href={`${settings}#password`}
				className="shrink-0 self-start rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:self-auto"
			>
				Set password
			</Link>
		</section>
	);
}
