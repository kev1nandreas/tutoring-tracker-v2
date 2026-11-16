import { ApiError } from "@/lib/errors";
import {
	type DownloadResult,
	download,
	upload,
} from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";

/** One spreadsheet row the backend rejected. */
export type ScheduleRowError = { row: number; message: string };

/** The file was read, but some rows are wrong, so nothing was imported. */
export class ScheduleImportError extends ApiError {
	rows: ScheduleRowError[];

	constructor(message: string, rows: ScheduleRowError[]) {
		super(message, 422);
		this.name = "ScheduleImportError";
		this.rows = rows;
	}
}

export async function downloadScheduleTemplate() {
	const { OK, Kind, StatusCode } = await download(
		MAIN_ENDPOINT.Meeting.ImportTemplate,
	);
	if (!OK) {
		const r = Kind as { message?: string };
		throw new ApiError(
			r?.message ?? "Could not download the template.",
			StatusCode,
		);
	}
	return Kind as DownloadResult;
}

/** Uploads the filled template. Resolves with how many meetings were created. */
export async function importSchedule(tutorialId: string, file: File) {
	const formData = new FormData();
	formData.append("file", file);

	const { OK, Kind, StatusCode } = await upload<
		MainResponse<{ created: number; errors?: ScheduleRowError[] }>
	>(MAIN_ENDPOINT.Tutorial.ImportSchedule(tutorialId), formData);
	const response = Kind as MainResponse<{
		created: number;
		errors?: ScheduleRowError[];
	}>;

	if (!OK) {
		if (StatusCode === 422 && response?.data?.errors) {
			throw new ScheduleImportError(response.message, response.data.errors);
		}
		throw new ApiError(
			response?.error || response?.message || "Could not import the schedule.",
			StatusCode,
		);
	}
	return response.data?.created ?? 0;
}
