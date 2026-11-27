import { ApiError } from "@/lib/errors";
import { del, get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { AdminUserDetail, AdminUserRow } from "@/types/admin-user";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { RegisterRequest } from "@/types/register";
import type { Role } from "@/types/user";

export type UserListParams = {
	page: number;
	pageSize: number;
	/** Matches name, username, email or school. */
	search?: string;
	role?: Role;
	/** API column to sort by; defaults to newest first. */
	sort?: string;
	order?: "asc" | "desc";
};

function fail(Kind: unknown, StatusCode: number, fallback: string): never {
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, StatusCode);
}

export async function fetchUsers({
	page,
	pageSize,
	search,
	role,
	sort,
	order,
}: UserListParams) {
	const { OK, Kind, StatusCode } = await get<
		PaginatedMainResponse<AdminUserRow>
	>(MAIN_ENDPOINT.Admin.Users, {
		page,
		page_size: pageSize,
		...(search ? { q: search } : {}),
		...(role ? { role } : {}),
		...(sort ? { sort, order: order ?? "asc" } : {}),
	});
	if (!OK) fail(Kind, StatusCode, "Failed to load users.");
	const r = Kind as PaginatedMainResponse<AdminUserRow>;
	return { items: r.data ?? [], meta: r.meta };
}

export async function fetchUserDetail(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<AdminUserDetail>>(
		MAIN_ENDPOINT.Admin.User(id),
	);
	const data = (Kind as MainResponse<AdminUserDetail>)?.data;
	if (!OK || !data) fail(Kind, StatusCode, "Failed to load the user.");
	return data as AdminUserDetail;
}

/** Deletes the user and everything that is theirs. */
export async function deleteUser(id: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Admin.User(id),
	);
	if (!OK) fail(Kind, StatusCode, "Failed to delete the user.");
}

/** Creates an account of any role. */
export async function createUser({
	confirm_password: _,
	...body
}: RegisterRequest & { role: Role }) {
	const { OK, Kind, StatusCode } = await post<MainResponse>(
		MAIN_ENDPOINT.Admin.Users,
		body,
	);
	if (!OK) fail(Kind, StatusCode, "Failed to add the user.");
}
