import type { UploadTicket } from "@/types/attachment";

/** Upload failure; `retryable` is true for connection drops and server errors, not for refusals. */
export class UploadError extends Error {
	retryable: boolean;

	constructor(message: string, retryable: boolean) {
		super(message);
		this.name = "UploadError";
		this.retryable = retryable;
	}
}

/**
 * Uploads a file straight to MinIO with a presigned POST ticket. Uses XMLHttpRequest
 * because fetch cannot report upload progress. `onProgress` gets the bytes sent so far.
 * Abort with the signal; the promise then rejects with an AbortError.
 */
export function uploadToStorage(
	ticket: UploadTicket,
	file: File,
	onProgress: (loadedBytes: number) => void,
	signal?: AbortSignal,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const form = new FormData();
		for (const [key, value] of Object.entries(ticket.fields))
			form.append(key, value);
		form.append("file", file); // must come last

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded);
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(file.size);
				resolve();
			} else {
				reject(
					new Error(
						xhr.status === 403
							? "The upload was refused. It may have expired or be too large."
							: `Upload failed (${xhr.status}).`,
					),
				);
			}
		};
		xhr.onerror = () =>
			reject(
				new Error("Could not reach the file server. Check your connection."),
			);
		xhr.onabort = () =>
			reject(new DOMException("Upload cancelled", "AbortError"));

		signal?.addEventListener("abort", () => xhr.abort(), { once: true });
		if (signal?.aborted)
			return reject(new DOMException("Upload cancelled", "AbortError"));

		xhr.open("POST", ticket.upload_url);
		xhr.send(form);
	});
}
