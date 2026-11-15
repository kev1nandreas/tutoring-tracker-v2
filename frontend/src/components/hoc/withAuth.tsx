"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Loading from "@/app/loading";
import useAuthStore from "@/app/stores/useAuthStore";
import { ENV } from "@/configs/environment";
import useIdleTimeout from "@/hooks/useIdleTimeout";
import { getRefreshToken, getToken, removeToken } from "@/lib/cookies";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import { PATH } from "@/shared/path";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";

/**
 * Auto logout after 5 minutes of no mouse/keyboard/touch/scroll activity.
 * Production only — disabled in development so sessions aren't interrupted.
 */
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_LOGOUT_ENABLED = ENV.MODE === "production" && IDLE_TIMEOUT_MS > 0;

export interface WithAuthProps {
	user: User;
}

/**
 * Gate a page behind a verified session.
 *
 * Nothing renders until the stored token has been checked against the
 * matching profile endpoint, so a guarded page never flashes for a signed
 * out visitor. A missing or rejected token clears the session and sends the
 * visitor to the login page, carrying `?redirect=` so
 * both login mutations can bounce them back afterwards.
 *
 * The axios interceptor already refreshes an expired access token and
 * retries once, so a failure here means the session is genuinely unusable.
 */
export default function withAuth<P extends object>(
	Component: React.ComponentType<P>,
) {
	function ComponentWithAuth(props: P) {
		const router = useRouter();
		const pathname = usePathname();
		const loginPath = PATH.LOGIN;
		const profileEndpoint = MAIN_ENDPOINT.User.CurrentUser;

		const user = useAuthStore.useUser();
		const login = useAuthStore.useLogin();
		const logout = useAuthStore.useLogout();

		const [isVerified, setIsVerified] = React.useState(Boolean(user));

		React.useEffect(() => {
			let cancelled = false;

			const redirectToLogin = () => {
				removeToken();
				logout();
				router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
			};

			const verify = async () => {
				const token = getToken();

				if (!token) {
					redirectToLogin();
					return;
				}

				// The store is already hydrated for this session — the token was
				// verified on login or on an earlier guarded page.
				if (user) {
					setIsVerified(true);
					return;
				}

				const { OK, Kind } = await get<ApiResponse<User>>(profileEndpoint);

				if (cancelled) return;

				if (!OK) {
					redirectToLogin();
					return;
				}

				login({
					...(Kind as ApiResponse<User>).data,
					access_token: token,
					// The store needs both tokens; reuse the stored refresh token.
					refresh_token: getRefreshToken() || token,
				});
				setIsVerified(true);
			};

			verify();

			return () => {
				cancelled = true;
			};
		}, [user, login, logout, router, pathname, loginPath, profileEndpoint]);

		const handleIdle = React.useCallback(() => {
			removeToken();
			logout();
			router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
		}, [logout, router, pathname, loginPath]);

		useIdleTimeout(
			handleIdle,
			IDLE_TIMEOUT_MS,
			IDLE_LOGOUT_ENABLED && isVerified && Boolean(user),
		);

		if (!isVerified || !user) {
			return <Loading />;
		}

		return <Component {...props} user={user} />;
	}

	ComponentWithAuth.displayName = `withAuth(${
		Component.displayName || Component.name || "Component"
	})`;

	return ComponentWithAuth;
}
