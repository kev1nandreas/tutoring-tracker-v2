// import type { NextRequest } from "next/server";
// import { NextResponse } from "next/server";
// import { ENV } from "./configs/environment";
// import { PATH } from "./shared/path";
//
// // Exact paths that never require a session.
// const PUBLIC_PATHS: string[] = [
// 	PATH.HOME,
// 	PATH.LOGIN,
// 	PATH.FORGOT_PASSWORD,
// 	PATH.RESET_PASSWORD,
// 	PATH.NOT_FOUND,
// ];
//
// // Path prefixes that never require a session.
// const PUBLIC_PREFIXES = ["/sandbox"];
//
// export async function proxy(request: NextRequest) {
// 	const token = request.cookies.get(ENV.TOKEN_KEY)?.value;
// 	const { pathname } = request.nextUrl;
//
// 	if (
// 		PUBLIC_PATHS.includes(pathname) ||
// 		PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
// 	) {
// 		return NextResponse.next();
// 	}
//
// 	if (!token) {
// 		const loginUrl = new URL(PATH.LOGIN, request.url);
// 		loginUrl.searchParams.set("redirect", pathname);
//
// 		return NextResponse.redirect(loginUrl);
// 	}
//
// 	return NextResponse.next();
// }
//
// export const config = {
// 	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
// };

// Next.js requires proxy.ts to export a function, so keep a no-op
// pass-through while the auth middleware above is disabled.
import { NextResponse } from "next/server";

export function proxy() {
	return NextResponse.next();
}
