"use server";

import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { removeToken } from "@/lib/cookies";
import api from "./interceptor";

interface Status {
	Code: number;
	Message: string;
}

interface ApiResponse<T> {
	Results: T;
	Status: Status;
}

interface ErrorResponse {
	Message: string;
}

interface Res<T> {
	OK: boolean;
	Kind: T | ApiResponse<T> | ErrorResponse;
	StatusCode: number;
}

export async function get<T>(
	url: string,
	params?: Record<string, unknown>,
): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.get(url, { params });
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export async function post<T>(
	url: string,
	data: Record<string, unknown>,
	config?: AxiosRequestConfig,
): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.post(url, data, config);
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export async function put<T>(
	url: string,
	data: Record<string, unknown>,
): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.put(url, data);
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export async function patch<T>(
	url: string,
	data: Record<string, unknown>,
): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.patch(url, data);
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export async function del<T>(url: string): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.delete(url);
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export async function upload<T>(
	url: string,
	formData: FormData,
): Promise<Res<T>> {
	try {
		const response: AxiosResponse<T> = await api.post(url, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return {
			OK: true,
			StatusCode: response.status,
			Kind: response.data,
		};
	} catch (error: unknown) {
		return handleAxiosError(error);
	}
}

export interface DownloadResult {
	base64: string;
	contentType: string;
	filename: string | null;
}

export async function download(
	url: string,
	params?: Record<string, unknown>,
): Promise<Res<DownloadResult>> {
	try {
		const response: AxiosResponse<ArrayBuffer> = await api.get(url, {
			params,
			responseType: "arraybuffer",
		});
		const disposition = String(response.headers["content-disposition"] ?? "");
		const filename =
			/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1] ?? null;

		return {
			OK: true,
			StatusCode: response.status,
			Kind: {
				base64: Buffer.from(response.data).toString("base64"),
				contentType: String(response.headers["content-type"] ?? ""),
				filename: filename ? decodeURIComponent(filename) : null,
			},
		};
	} catch (error: unknown) {
		if (error && typeof error === "object" && "response" in error) {
			const axiosError = error as AxiosError;
			const raw = axiosError.response?.data;

			if (raw && typeof raw === "object") {
				try {
					axiosError.response = {
						...axiosError.response,
						data: JSON.parse(Buffer.from(raw as ArrayBuffer).toString("utf-8")),
					} as AxiosResponse;
				} catch {}
			}
		}

		return handleAxiosError(error);
	}
}

function handleAxiosError<T>(error: unknown): Res<T> {
	if (error && typeof error === "object" && "isAxiosError" in error) {
		const axiosError = error as AxiosError;
		const StatusCode = axiosError.response?.status || 500;

		if (axiosError.response) {
			if (StatusCode === 401) {
				removeToken();
			}
			return {
				OK: false,
				StatusCode,
				Kind: (axiosError.response.data as ErrorResponse) || {
					Message: "Unknown error",
				},
			};
		}
	}

	return {
		OK: false,
		StatusCode: 500,
		Kind: { Message: error instanceof Error ? error.message : "Unknown error" },
	};
}
