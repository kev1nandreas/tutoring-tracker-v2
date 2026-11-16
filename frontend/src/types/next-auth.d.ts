import "next-auth";
import "next-auth/jwt";
import type { User } from "@/types/user";

/** A Google identity with no account yet, waiting for the register form. */
type GoogleRegistration = { token: string; email: string; name: string };

declare module "next-auth" {
	interface Session {
		/** Backend JWT, present only right after Google sign-in. */
		appToken?: string;
		appUser?: User;
		registration?: GoogleRegistration;
		error?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		appToken?: string;
		appUser?: User;
		registration?: GoogleRegistration;
		error?: string;
	}
}
