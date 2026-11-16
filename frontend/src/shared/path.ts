import type { Role } from "@/types/user";

export const PATH = {
	NOT_FOUND: "/404",
	HOME: "/",
	STUDENT_HOME: "/",
	DASHBOARD: "/tutor",
	LOGIN: "/login",
	REGISTER: "/register",
	FORGOT_PASSWORD: "/forgot-password",
	RESET_PASSWORD: "/reset-password",
};

/** Landing page for a role after login. */
export const homeForRole = (role?: Role): string =>
	role === "student" ? PATH.STUDENT_HOME : PATH.DASHBOARD;
