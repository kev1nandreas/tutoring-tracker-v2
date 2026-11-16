import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import toast from "react-hot-toast";
import { attachmentsKey } from "@/hooks/useMeetingAttachments";
import { withRetry } from "@/lib/retry";
import { UploadError, uploadToStorage } from "@/lib/uploadToStorage";
import {
	completeUploads,
	isTransient,
	requestUploadTicket,
} from "@/services/api/main/attachment";
import {
	type AttachmentType,
	attachmentProblem,
	detectAttachmentType,
} from "@/types/attachment";

export type UploadStatus =
	| "queued"
	| "uploading"
	| "uploaded"
	| "saving"
	| "done"
	| "error";

export type UploadItem = {
	id: string;
	file: File;
	type: AttachmentType;
	status: UploadStatus;
	/** Bytes sent so far. */
	loaded: number;
	error?: string;
	/** Storage key once the file is in MinIO. */
	key?: string;
	/** Shown while a temporary failure is being retried. */
	note?: string;
};

const CONCURRENCY = 2;
/** Tries per step (ticket, upload, save) before a file is marked as failed. */
const ATTEMPTS = 3;

/**
 * Upload queue for one meeting: ticket -> straight to storage (with progress) -> save.
 * Files upload two at a time; a failed file can be retried without redoing the others.
 */
export function useUploadQueue(meetingId: string) {
	const queryClient = useQueryClient();
	const [items, setItems] = React.useState<UploadItem[]>([]);
	const [isRunning, setIsRunning] = React.useState(false);
	const abortRef = React.useRef<AbortController | null>(null);
	// the latest items, readable right after an update (state is not, inside async code)
	const itemsRef = React.useRef<UploadItem[]>([]);

	const update = React.useCallback(
		(fn: (prev: UploadItem[]) => UploadItem[]) => {
			itemsRef.current = fn(itemsRef.current);
			setItems(itemsRef.current);
		},
		[],
	);

	const patch = React.useCallback(
		(id: string, change: Partial<UploadItem>) =>
			update((prev) =>
				prev.map((it) => (it.id === id ? { ...it, ...change } : it)),
			),
		[update],
	);

	const add = React.useCallback(
		(files: File[]) =>
			update((prev) => [
				...prev,
				...files.map((file) => ({
					id: crypto.randomUUID(),
					file,
					type: detectAttachmentType(file.name),
					status: "queued" as const,
					loaded: 0,
				})),
			]),
		[update],
	);

	const setType = (id: string, type: AttachmentType) => patch(id, { type });
	const remove = (id: string) =>
		update((prev) => prev.filter((it) => it.id !== id));
	const reset = React.useCallback(() => update(() => []), [update]);

	/** Why this file cannot be sent yet (wrong extension for its type, too big...). */
	const problemOf = (it: UploadItem) =>
		it.status === "done" ? null : attachmentProblem(it.file, it.type);

	const finalize = async () => {
		const ready = itemsRef.current.filter(
			(it) => it.key && (it.status === "uploaded" || it.status === "error"),
		);
		if (ready.length === 0) return;

		for (const it of ready)
			patch(it.id, { status: "saving", error: undefined });
		try {
			await withRetry(
				() =>
					completeUploads(
						meetingId,
						ready.map((it) => ({
							key: it.key as string,
							name: it.file.name,
							type: it.type,
						})),
					),
				{ attempts: ATTEMPTS, shouldRetry: isTransient },
			);
			for (const it of ready) patch(it.id, { status: "done" });
			toast.success(
				`${ready.length} ${ready.length === 1 ? "file" : "files"} uploaded.`,
			);
			queryClient.invalidateQueries({ queryKey: attachmentsKey(meetingId) });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
		} catch (e) {
			const message =
				e instanceof Error ? e.message : "Could not save the files.";
			for (const it of ready) patch(it.id, { status: "error", error: message });
		}
	};

	const start = async () => {
		const controller = new AbortController();
		abortRef.current = controller;
		setIsRunning(true);

		// files still to send: never sent, or failed before reaching storage
		const todo = itemsRef.current.filter(
			(it) =>
				(it.status === "queued" || (it.status === "error" && !it.key)) &&
				!problemOf(it),
		);

		let cursor = 0;
		const worker = async () => {
			while (cursor < todo.length && !controller.signal.aborted) {
				const it = todo[cursor++];
				patch(it.id, { status: "uploading", loaded: 0, error: undefined });
				try {
					const retryNote = (next: number) =>
						patch(it.id, {
							note: `Connection problem, retrying (${next}/${ATTEMPTS})…`,
							loaded: 0,
						});
					const ticket = await withRetry(
						() => requestUploadTicket(meetingId, it.file, it.type),
						{
							attempts: ATTEMPTS,
							shouldRetry: isTransient,
							onRetry: retryNote,
							signal: controller.signal,
						},
					);
					// the ticket stays valid for minutes, so a retry reuses it
					await withRetry(
						() =>
							uploadToStorage(
								ticket,
								it.file,
								(loaded) => patch(it.id, { loaded, note: undefined }),
								controller.signal,
							),
						{
							attempts: ATTEMPTS,
							shouldRetry: (e) => e instanceof UploadError && e.retryable,
							onRetry: retryNote,
							signal: controller.signal,
						},
					);
					patch(it.id, {
						status: "uploaded",
						loaded: it.file.size,
						key: ticket.key,
						note: undefined,
					});
				} catch (e) {
					if (e instanceof DOMException && e.name === "AbortError")
						patch(it.id, { status: "queued", loaded: 0 });
					else
						patch(it.id, {
							status: "error",
							error: e instanceof Error ? e.message : "Upload failed.",
						});
				}
			}
		};
		await Promise.all(
			Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker),
		);

		// save everything that reached storage, in one request
		if (!controller.signal.aborted) await finalize();
		setIsRunning(false);
	};

	const cancel = () => abortRef.current?.abort();

	const total = items.reduce((n, it) => n + it.file.size, 0);
	const sent = items.reduce(
		(n, it) =>
			n +
			(it.status === "done" ||
			it.status === "saving" ||
			it.status === "uploaded"
				? it.file.size
				: Math.min(it.loaded, it.file.size)),
		0,
	);

	return {
		items,
		isRunning,
		add,
		setType,
		remove,
		reset,
		start,
		cancel,
		problemOf,
		totalBytes: total,
		sentBytes: sent,
		percent: total === 0 ? 0 : Math.round((sent / total) * 100),
		doneCount: items.filter((it) => it.status === "done").length,
		canStart:
			!isRunning &&
			items.some((it) => it.status === "queued" || it.status === "error"),
	};
}
