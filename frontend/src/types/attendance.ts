/** Largest attendance photo, in bytes. The backend enforces it. */
export const ATTENDANCE_MAX_BYTES = 10 * 1024 * 1024;
export const ATTENDANCE_ACCEPT = "image/jpeg,image/png,image/webp";
const OK_EXT = [".jpg", ".jpeg", ".png", ".webp"];

/** Why a file cannot be used as an attendance photo, or null when it is fine. */
export function attendancePhotoProblem(file: {
	name: string;
	size: number;
}): string | null {
	const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (!OK_EXT.includes(ext)) return "Use a .jpg, .png or .webp photo.";
	if (file.size === 0) return "The photo is empty.";
	if (file.size > ATTENDANCE_MAX_BYTES)
		return "The photo is too large (10 MB at most).";
	return null;
}

/** The student's own check-in for a meeting. */
export type MyAttendance = {
	marked: boolean;
	marked_at?: string;
	/** Short-lived link to the photo, only when marked. */
	photo_url?: string;
	/** True only on the meeting day. */
	can_mark: boolean;
};

export type RosterStudent = {
	user_id: string;
	name: string;
	username: string;
	present: boolean;
	marked_at?: string;
	photo_url?: string;
};

export type AttendanceRoster = {
	present: number;
	total: number;
	students: RosterStudent[];
};
