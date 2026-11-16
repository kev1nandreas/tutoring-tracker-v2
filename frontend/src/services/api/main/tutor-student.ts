import { ApiError } from "@/lib/errors";
import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { StudentDetail, StudentRow } from "@/types/tutor-student";

export type StudentListParams = {
	page: number;
	pageSize: number;
	/** Matches name, username, email or school. */
	search?: string;
};

export async function fetchStudents({
	page,
	pageSize,
	search,
}: StudentListParams) {
	const { OK, Kind, StatusCode } = await get<PaginatedMainResponse<StudentRow>>(
		MAIN_ENDPOINT.Student.List,
		{ page, page_size: pageSize, ...(search ? { q: search } : {}) },
	);
	const r = Kind as PaginatedMainResponse<StudentRow>;
	if (!OK) {
		throw new ApiError(
			r?.error || r?.message || "Failed to load students.",
			StatusCode,
		);
	}
	return { items: r.data ?? [], meta: r.meta };
}

export async function fetchStudentDetail(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<StudentDetail>>(
		MAIN_ENDPOINT.Student.Detail(id),
	);
	const r = Kind as MainResponse<StudentDetail>;
	if (!OK) {
		throw new ApiError(
			r?.error || r?.message || "Failed to load the student.",
			StatusCode,
		);
	}
	return r.data as StudentDetail;
}
