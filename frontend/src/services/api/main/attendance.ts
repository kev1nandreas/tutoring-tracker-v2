import { ApiError } from "@/lib/errors";
import { get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { UploadTicket } from "@/types/attachment";
import type { AttendanceRoster, MyAttendance } from "@/types/attendance";

function fail(Kind: unknown, StatusCode: number, fallback: string): never {
	if (StatusCode === 429)
		throw new ApiError("Too many requests. Please wait a moment.", 429);
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, StatusCode);
}

/** The student's own check-in. 403 means attendance is off for this class. */
export async function fetchMyAttendance(meetingId: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<MyAttendance>>(
		MAIN_ENDPOINT.Attendance.Mine(meetingId),
	);
	if (!OK) fail(Kind, StatusCode, "Could not load your attendance.");
	return (Kind as MainResponse<MyAttendance>).data as MyAttendance;
}

export async function requestAttendanceTicket(
	meetingId: string,
	file: { name: string; size: number },
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<UploadTicket>>(
		MAIN_ENDPOINT.Attendance.UploadUrl(meetingId),
		{
			name: file.name,
			size: file.size,
		},
	);
	if (!OK) fail(Kind, StatusCode, "Could not start the upload.");
	return (Kind as MainResponse<UploadTicket>).data as UploadTicket;
}

/** Save the uploaded photo as the check-in (replaces an earlier one). */
export async function markAttendance(meetingId: string, key: string) {
	const { OK, Kind, StatusCode } = await post<MainResponse<MyAttendance>>(
		MAIN_ENDPOINT.Attendance.Roster(meetingId),
		{ key },
	);
	if (!OK) fail(Kind, StatusCode, "Could not save your attendance.");
	return (Kind as MainResponse<MyAttendance>).data as MyAttendance;
}

/** Tutor: who checked in to the meeting. 403 means attendance is off for this class. */
export async function fetchAttendanceRoster(meetingId: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<AttendanceRoster>>(
		MAIN_ENDPOINT.Attendance.Roster(meetingId),
	);
	if (!OK) fail(Kind, StatusCode, "Could not load attendance.");
	return (Kind as MainResponse<AttendanceRoster>).data as AttendanceRoster;
}
