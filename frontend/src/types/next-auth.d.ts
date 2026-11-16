import "next-auth";
import "next-auth/jwt";
import type { User } from "@/types/user";

declare module "next-auth" {
	interface Session {
		/** Backend JWT, present only right after Google sign-in. */
		appToken?: string;
		appUser?: User;
		error?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		appToken?: string;
		appUser?: User;
		error?: string;
	}
}
