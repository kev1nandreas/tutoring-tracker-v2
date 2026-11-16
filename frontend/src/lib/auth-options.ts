import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ENV } from "@/configs/environment";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { LoginResponse } from "@/types/login";

/**
 * NextAuth only runs the Google OAuth step. Right after it, the Google ID token is
 * exchanged with the backend for the app's own JWT and user, which the
 * `/login/google` page then moves into the normal session cookie.
 */
async function exchangeWithBackend(idToken: string) {
	const res = await fetch(`${ENV.URI.BASE_URL}${MAIN_ENDPOINT.Auth.Google}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id_token: idToken }),
		cache: "no-store",
	});
	const body = (await res
		.json()
		.catch(() => null)) as MainResponse<LoginResponse> | null;
	if (!res.ok || !body?.data?.token) {
		throw new Error(body?.message || "Google sign-in failed.");
	}
	return body.data;
}

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),
	],
	session: { strategy: "jwt", maxAge: 5 * 60 },
	pages: { signIn: "/login", error: "/login" },
	callbacks: {
		async jwt({ token, account }) {
			if (account?.id_token) {
				try {
					const { token: appToken, user } = await exchangeWithBackend(
						account.id_token,
					);
					token.appToken = appToken;
					token.appUser = user;
					token.error = undefined;
				} catch (e) {
					token.error =
						e instanceof Error ? e.message : "Google sign-in failed.";
				}
			}
			return token;
		},
		async session({ session, token }) {
			session.appToken = token.appToken;
			session.appUser = token.appUser;
			session.error = token.error;
			return session;
		},
	},
};
