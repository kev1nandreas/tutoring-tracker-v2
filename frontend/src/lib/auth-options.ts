import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ENV } from "@/configs/environment";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { GoogleLoginResponse } from "@/types/login";

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
		.catch(() => null)) as MainResponse<GoogleLoginResponse> | null;
	if (!res.ok || !body?.data) {
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
	session: { strategy: "jwt", maxAge: 15 * 60 },
	pages: { signIn: "/login", error: "/login" },
	callbacks: {
		async jwt({ token, account }) {
			if (account?.id_token) {
				try {
					const data = await exchangeWithBackend(account.id_token);
					token.error = undefined;
					if (data.needs_registration && data.registration_token) {
						// no account for this email yet: the register form finishes it
						token.registration = {
							token: data.registration_token,
							email: data.email ?? "",
							name: data.name ?? "",
						};
					} else if (data.token && data.user) {
						token.appToken = data.token;
						token.appUser = data.user;
					} else {
						throw new Error("Google sign-in failed.");
					}
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
			session.registration = token.registration;
			session.error = token.error;
			return session;
		},
	},
};
