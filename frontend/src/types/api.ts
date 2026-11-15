export type PaginateData<Data> = {
	data_per_page: Data;
	meta: {
		page: number;
		max_page: number;
	};
};

export interface PaginatedApiResponse<DataType> {
	code: number;
	status: boolean;
	message: string;
	data: PaginateData<DataType>;
}

export type ApiResponse<T> = {
	message: string;
	status: boolean;
	code: number;
	data: T;
};

export type SortOrder = "asc" | "desc";

export type ListParams = {
	search?: string;
	sort_by?: string;
	sort_order?: SortOrder;
	page?: number;
	limit?: number;
};

export type ListMeta = {
	page: number;
	limit: number;
	total: number;
	total_pages: number;
	sort_by: string;
	sort_order: SortOrder;
};

export type ListResponse<T> = ApiResponse<{ items: T[] }> & {
	meta: ListMeta;
};

export type ApiError = {
	code: number;
	status: boolean | number;
	message: string;
};

export type UninterceptedApiError = {
	code: number;
	status: boolean;
	message: string | Record<string, string[]>;
};
