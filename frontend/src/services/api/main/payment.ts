import { ApiError } from "@/lib/errors";
import { del, get, post, put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse, PaginatedMainResponse } from "@/types/api";
import type { Payment, PaymentFilter, PaymentRequest } from "@/types/payment";

export type PaymentListParams = {
	page: number;
	pageSize: number;
	filter: PaymentFilter;
};

export async function fetchPayments({
	page,
	pageSize,
	filter,
}: PaymentListParams) {
	const params: Record<string, unknown> = {
		page,
		page_size: pageSize,
		sort: "payment_date",
		order: "desc",
	};
	if (filter !== "all") params.is_paid = filter === "paid";

	const { OK, Kind, StatusCode } = await get<PaginatedMainResponse<Payment>>(
		MAIN_ENDPOINT.Payment.List,
		params,
	);
	const r = Kind as PaginatedMainResponse<Payment>;
	if (!OK) {
		throw new ApiError(
			r?.error || r?.message || "Failed to load payments.",
			StatusCode,
		);
	}
	return { items: r.data ?? [], meta: r.meta };
}

export async function createPayment(data: PaymentRequest) {
	const { OK, Kind, StatusCode } = await post<MainResponse<Payment>>(
		MAIN_ENDPOINT.Payment.List,
		data,
	);
	const r = Kind as MainResponse<Payment>;
	if (!OK) {
		throw new ApiError(
			r?.error || r?.message || "Failed to save the payment.",
			StatusCode,
		);
	}
	return r.data;
}

export async function updatePayment(id: string, data: PaymentRequest) {
	const { OK, Kind, StatusCode } = await put<MainResponse<Payment>>(
		MAIN_ENDPOINT.Payment.Detail(id),
		data,
	);
	const r = Kind as MainResponse<Payment>;
	if (!OK) {
		throw new ApiError(
			r?.error || r?.message || "Failed to update the payment.",
			StatusCode,
		);
	}
	return r.data;
}

export async function deletePayment(id: string) {
	const { OK, Kind, StatusCode } = await del<MainResponse>(
		MAIN_ENDPOINT.Payment.Detail(id),
	);
	if (!OK) {
		const r = Kind as MainResponse;
		throw new ApiError(
			r?.error || r?.message || "Failed to delete the payment.",
			StatusCode,
		);
	}
}
