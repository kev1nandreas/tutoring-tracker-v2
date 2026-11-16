"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Loading from "@/app/loading";
import useAuthStore from "@/app/stores/useAuthStore";
import { ENV } from "@/configs/environment";
import useIdleTimeout from "@/hooks/useIdleTimeout";
import { getToken, removeToken } from "@/lib/cookies";
import { decodeToken } from "@/lib/jwt";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { homeForRole, PATH } from "@/shared/path";
import type { MainResponse } from "@/types/api";
import type { Role, User } from "@/types/user";

/**
 * Auto logout after 5 minutes of no mouse/keyboard/touch/scroll activity.
 * Production only — disabled in development so sessions aren't interrupted.
 */
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_LOGOUT_ENABLED = ENV.MODE === "production" && IDLE_TIMEOUT_MS > 0;

export interface WithAuthProps {
	user: User;
}

export interface WithAuthOptions {
	/** Roles allowed to see the page. Others are sent to their own home. */
	roles?: Role[];
}

/**
 * Gate a page behind a valid session and (optionally) a role.
 *
 * A missing/expired token, or a token the backend rejects on `/me`, clears the
 * session and redirects to login with `?redirect=`. The user's id and role come
 * from `/me`; a signed-in user with the wrong role is redirected to the home of
 * their own role. Nothing renders until this check passes.
 */
export default function withAuth<P extends object>(
	Component: React.ComponentType<P & WithAuthProps>,
	options: WithAuthOptions = {},
) {
	const allowedRoles = options.roles;

	function ComponentWithAuth(props: P) {
		const router = useRouter();
		const pathname = usePathname();

		const user = useAuthStore.useUser();
		const login = useAuthStore.useLogin();
		const logout = useAuthStore.useLogout();

		const [isReady, setIsReady] = React.useState(false);

		const redirectToLogin = React.useCallback(() => {
			removeToken();
			logout();
			router.replace(`${PATH.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
		}, [logout, router, pathname]);

		React.useEffect(() => {
			let cancelled = false;
			let timer: ReturnType<typeof setTimeout> | undefined;

			const verify = async () => {
				const token = getToken();
				const exp = token ? decodeToken(token)?.exp : undefined;

				if (!token || !exp || exp * 1000 <= Date.now()) {
					redirectToLogin();
					return;
				}

				// Ask the backend who this is. The role and id come from /me, not
				// from the token, so a demoted or deleted user is caught here.
				let sessionUser = user;
				if (!sessionUser) {
					const { OK, Kind } = await get<MainResponse<User>>(
						MAIN_ENDPOINT.User.Me,
					);
					if (cancelled) return;

					const me = (Kind as MainResponse<User>)?.data;
					if (!OK || !me) {
						redirectToLogin();
						return;
					}
					login({ ...me, access_token: token });
					sessionUser = me;
				}

				if (allowedRoles && !allowedRoles.includes(sessionUser.role)) {
					router.replace(homeForRole(sessionUser.role));
					return;
				}

				setIsReady(true);

				// The token cannot be refreshed: sign out the moment it expires.
				timer = setTimeout(
					redirectToLogin,
					Math.max(exp * 1000 - Date.now(), 0),
				);
			};

			verify();

			return () => {
				cancelled = true;
				if (timer) clearTimeout(timer);
			};
		}, [user, login, router, redirectToLogin]);

		useIdleTimeout(
			redirectToLogin,
			IDLE_TIMEOUT_MS,
			IDLE_LOGOUT_ENABLED && isReady && Boolean(user),
		);

		if (!isReady || !user) {
			return <Loading />;
		}

		return <Component {...props} user={user} />;
	}

	ComponentWithAuth.displayName = `withAuth(${
		Component.displayName || Component.name || "Component"
	})`;

	return ComponentWithAuth;
}
