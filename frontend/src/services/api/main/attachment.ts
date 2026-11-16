import { ApiError } from "@/lib/errors";
import { del, get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type {
	Attachment,
	AttachmentDownload,
	AttachmentType,
	UploadTicket,
} from "@/types/attachment";

function fail(Kind: unknown, StatusCode: number, fallback: string): never {
	if (StatusCode === 429)
		throw new ApiError("Too many requests. Please wait a moment.", 429);
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, StatusCode);
}

/** Failures worth trying again: rate limit, server trouble, or a dropped connection (reported as 500). */
export const isTransient = (error: unknown) =>
	error instanceof ApiError
		? error.status === 429 || error.status >= 500
		: false;

/** Files of a meeting, newest first (up to 100). 403 means the tutor does not share files. */
export async function fetchMeetingAttachments(meetingId: string) {
	const { OK, Kind, StatusCode } = await get<PaginatedMainResponse<Attachment>>(
		MAIN_ENDPOINT.Attachment.List(meetingId),
		{ page: 1, page_size: 100, sort: "created_at", order: "desc" },
	);
	if (!OK) fail(Kind, StatusCode, "Failed to load files.");
	return (Kind as PaginatedMainResponse<Attachment>).data ?? [];
}

export async function requestUploadTicket(
	meetingId: string,
	file: { name: string; size: number },
	type: AttachmentType,
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<UploadTicket>>(
		MAIN_ENDPOINT.Attachment.UploadUrl(meetingId),
		{
			name: file.name,
			type,
			size: file.size,
		},
	);
	if (!OK) fail(Kind, StatusCode, "Could not start the upload.");
	return (Kind as MainResponse<UploadTicket>).data as UploadTicket;
}

export type CompletedFile = { key: string; name: string; type: AttachmentType };

export async function completeUploads(
	meetingId: string,
	items: CompletedFile[],
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<Attachment[]>>(
		MAIN_ENDPOINT.Attachment.Complete(meetingId),
		{
			items,
		},
	);
	if (!OK) fail(Kind, StatusCode, "Could not save the files.");
	return (Kind as MainResponse<Attachment[]>).data ?? [];
}

/** Short-lived link to open (inline) or download one file. */
export async function fetchAttachmentDownload(id: string, inline: boolean) {
	const { OK, Kind, StatusCode } = await get<MainResponse<AttachmentDownload>>(
		MAIN_ENDPOINT.Attachment.Download(id),
		{
			inline,
		},
	);
	if (!OK) fail(Kind, StatusCode, "Could not open the file.");
	return (Kind as MainResponse<AttachmentDownload>).data as AttachmentDownload;
}

export async function deleteAttachment(id: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Attachment.Detail(id),
	);
	if (!OK) fail(Kind, StatusCode, "Could not delete the file.");
}
