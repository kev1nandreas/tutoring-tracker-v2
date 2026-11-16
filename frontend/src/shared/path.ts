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
	STUDENTS: "/tutor/students",
	PAYMENTS: "/tutor/payments",
	NOTIFICATIONS: "/notifications",
	TUTOR_NOTIFICATIONS: "/tutor/notifications",
	LOGIN: "/login",
	FEEDBACK: "/form/feedback",
	REGISTER: "/register",
	FORGOT_PASSWORD: "/forgot-password",
	RESET_PASSWORD: "/reset-password",
};

/** Public feedback form of a finished tutorial, by its code. */
export const feedbackFormPath = (code: string, from?: string) =>
	`${PATH.FEEDBACK}/${code}${from ? `?from=${from}` : ""}`;

/** What students said about one tutorial (tutor view). */
export const tutorialFeedbackPath = (tutorialId: string) =>
	`${PATH.TUTORIALS}/${tutorialId}/feedback`;

/** Homework (submissions and grading) of one meeting. */
export const homeworkPath = (tutorialId: string, meetingId: string) =>
	`${PATH.TUTORIALS}/${tutorialId}/meetings/${meetingId}/homework`;

/** Attendance (who checked in with a photo) of one meeting. */
export const attendancePath = (tutorialId: string, meetingId: string) =>
	`${PATH.TUTORIALS}/${tutorialId}/meetings/${meetingId}/attendance`;

/** Landing page for a role after login. */
export const homeForRole = (role?: Role): string =>
	role === "student" ? PATH.STUDENT_HOME : PATH.DASHBOARD;

/** The notifications page of a role. */
export const notificationsPath = (role?: Role): string =>
	role === "student" ? PATH.NOTIFICATIONS : PATH.TUTOR_NOTIFICATIONS;
