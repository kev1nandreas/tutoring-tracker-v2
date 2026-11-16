import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ENV } from "./configs/environment";
import { PATH } from "./shared/path";

// Exact paths that never require a session.
const PUBLIC_PATHS: string[] = [
	PATH.LOGIN,
	PATH.REGISTER,
	PATH.FORGOT_PASSWORD,
	PATH.RESET_PASSWORD,
	PATH.NOT_FOUND,
];

// Path prefixes that never require a session.
const PUBLIC_PREFIXES = ["/sandbox"];

/** True when the JWT payload has an `exp` in the future (signature is checked by the API). */
function hasLiveToken(token: string | undefined): boolean {
	if (!token) return false;
	try {
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const { exp } = JSON.parse(atob(base64)) as { exp?: number };
		return typeof exp === "number" && exp * 1000 > Date.now();
	} catch {
		return false;
	}
}

/**
 * No (valid) session cookie: redirect to login before any page renders.
 * Role checks stay in `withAuth`, which verifies the user with `/me`.
 */
export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (
		PUBLIC_PATHS.includes(pathname) ||
		PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	) {
		return NextResponse.next();
	}

	if (hasLiveToken(request.cookies.get(ENV.TOKEN_KEY)?.value)) {
		return NextResponse.next();
	}

	const loginUrl = new URL(PATH.LOGIN, request.url);
	if (pathname !== PATH.HOME) {
		loginUrl.searchParams.set("redirect", `${pathname}${search}`);
	}

	const response = NextResponse.redirect(loginUrl);
	// Drop a stale/expired cookie so it is not sent again.
	response.cookies.delete(ENV.TOKEN_KEY);
	response.cookies.delete(ENV.REFRESH_TOKEN_KEY);
	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
