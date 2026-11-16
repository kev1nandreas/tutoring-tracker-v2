import type { Role } from "@/types/user";

export const PATH = {
	NOT_FOUND: "/404",
	HOME: "/",
	STUDENT_HOME: "/",
	ENROLL: "/enroll",
	STUDENT_TUTORIALS: "/tutorials",
	DASHBOARD: "/tutor",
	TUTORIALS: "/tutor/tutorials",
	PENDING_VALIDATION: "/tutor/pending-validation",
	LOGIN: "/login",
	REGISTER: "/register",
	FORGOT_PASSWORD: "/forgot-password",
	RESET_PASSWORD: "/reset-password",
};

/** Homework (submissions and grading) of one meeting. */
export const homeworkPath = (tutorialId: string, meetingId: string) =>
	`${PATH.TUTORIALS}/${tutorialId}/meetings/${meetingId}/homework`;

/** Landing page for a role after login. */
export const homeForRole = (role?: Role): string =>
	role === "student" ? PATH.STUDENT_HOME : PATH.DASHBOARD;
