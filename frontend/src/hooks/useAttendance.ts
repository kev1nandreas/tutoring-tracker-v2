import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/errors";
import { withRetry } from "@/lib/retry";
import { UploadError, uploadToStorage } from "@/lib/uploadToStorage";
import { isTransient } from "@/services/api/main/attachment";
import {
	fetchAttendanceRoster,
	fetchMyAttendance,
	markAttendance,
	requestAttendanceTicket,
} from "@/services/api/main/attendance";
import { attendancePhotoProblem } from "@/types/attendance";

// 403 / 404 will not change on retry
const retryUnlessRefused = (count: number, error: Error) =>
	!(error instanceof ApiError && [403, 404].includes(error.status)) &&
	count < 2;

export const myAttendanceKey = (meetingId: string) =>
	["meeting", meetingId, "attendance", "me"] as const;
export const rosterKey = (meetingId: string) =>
	["meeting", meetingId, "attendance", "roster"] as const;

/** The student's check-in. Pass null to stay idle (for example while a drawer is closed). */
export const useMyAttendance = (meetingId: string | null) =>
	useQuery({
		queryKey: myAttendanceKey(meetingId ?? ""),
		queryFn: () => fetchMyAttendance(meetingId as string),
		enabled: meetingId !== null,
		retry: retryUnlessRefused,
	});

/** Tutor: who checked in. Pass null to stay idle. */
export const useAttendanceRoster = (meetingId: string | null) =>
	useQuery({
		queryKey: rosterKey(meetingId ?? ""),
		queryFn: () => fetchAttendanceRoster(meetingId as string),
		enabled: meetingId !== null,
		retry: retryUnlessRefused,
	});

export type PhotoStage = "idle" | "uploading" | "saving";

/**
 * Check in with a photo: ticket -> straight to storage (with progress) -> save.
 * Temporary failures are retried a couple of times.
 */
export function useMarkAttendance(meetingId: string) {
	const queryClient = useQueryClient();
	const [stage, setStage] = React.useState<PhotoStage>("idle");
	const [percent, setPercent] = React.useState(0);

	const mutation = useMutation({
		mutationFn: async (file: File) => {
			const problem = attendancePhotoProblem(file);
			if (problem) throw new Error(problem);

			setStage("uploading");
			setPercent(0);
			const ticket = await withRetry(
				() => requestAttendanceTicket(meetingId, file),
				{ attempts: 3, shouldRetry: isTransient },
			);
			await withRetry(
				() =>
					uploadToStorage(ticket, file, (loaded) =>
						setPercent(Math.round((loaded / file.size) * 100)),
					),
				{
					attempts: 3,
					shouldRetry: (e) => e instanceof UploadError && e.retryable,
				},
			);

			setStage("saving");
			return withRetry(() => markAttendance(meetingId, ticket.key), {
				attempts: 3,
				shouldRetry: isTransient,
			});
		},
		onSuccess: () => {
			toast.success("Attendance marked.");
			queryClient.invalidateQueries({ queryKey: myAttendanceKey(meetingId) });
			queryClient.invalidateQueries({ queryKey: rosterKey(meetingId) });
		},
		onError: (error: Error) => toast.error(error.message),
		onSettled: () => setStage("idle"),
	});

	return { mark: mutation.mutate, stage, percent, isBusy: mutation.isPending };
}
