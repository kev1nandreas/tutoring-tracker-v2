import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ENV } from "./configs/environment";
import { PATH } from "./shared/path";

// Pages that need no session, and (login/register only) that a signed-in user skips.
const GUEST_PATHS = [PATH.LOGIN, PATH.REGISTER];
const PUBLIC_PATHS = [
	...GUEST_PATHS,
	PATH.FORGOT_PASSWORD,
	PATH.RESET_PASSWORD,
	PATH.NOT_FOUND,
];

/**
 * Cookie-only gate. Whether the token is valid, and which role may see which
 * page, is checked afterwards by `withAuth` (via `/me`).
 */
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hasCookie = Boolean(request.cookies.get(ENV.TOKEN_KEY)?.value);

	if (hasCookie && GUEST_PATHS.includes(pathname)) {
		return NextResponse.redirect(new URL(PATH.HOME, request.url));
	}

	if (
		hasCookie ||
		PUBLIC_PATHS.includes(pathname) ||
		pathname.startsWith("/sandbox") ||
		pathname.startsWith(`${PATH.FEEDBACK}/`)
	) {
		return NextResponse.next();
	}

	const loginUrl = new URL(PATH.LOGIN, request.url);
	if (pathname !== PATH.HOME) loginUrl.searchParams.set("redirect", pathname);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
