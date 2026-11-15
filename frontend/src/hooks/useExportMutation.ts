import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { type DownloadResult, download } from "@/services/api/main/call";

type ExportParams = Record<string, unknown>;

type UseExportMutationOptions = {
	endpoint: string;
	filename: string;
};

const EXTENSION_BY_CONTENT_TYPE: [match: string, extension: string][] = [
	["spreadsheetml", "xlsx"],
	["ms-excel", "xls"],
	["csv", "csv"],
	["pdf", "pdf"],
	["json", "json"],
];

function extensionFor(contentType: string) {
	return (
		EXTENSION_BY_CONTENT_TYPE.find(([match]) =>
			contentType.includes(match),
		)?.[1] ?? "xlsx"
	);
}

function saveFile(base64: string, contentType: string, filename: string) {
	const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
	const url = URL.createObjectURL(new Blob([bytes], { type: contentType }));
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/**
 * Shared export hook: `mutate(params)` calls the export endpoint with the
 * page's current filters and saves the returned file to disk.
 */
export function useExportMutation({
	endpoint,
	filename,
}: UseExportMutationOptions) {
	return useMutation({
		mutationFn: async (params?: ExportParams) => {
			const { OK, Kind, StatusCode } = await download(endpoint, params);

			if (!OK) {
				const response = Kind as { message?: string; Message?: string };
				throw new Error(
					response?.message ??
						response?.Message ??
						`Gagal mengekspor data (${StatusCode}).`,
				);
			}

			const file = Kind as DownloadResult;
			const date = new Date().toISOString().slice(0, 10);
			const format = typeof params?.format === "string" ? params.format : null;

			saveFile(
				file.base64,
				file.contentType,
				file.filename ??
					`${filename}-${date}.${format ?? extensionFor(file.contentType)}`,
			);
		},
		onSuccess: () => {
			toast.success("Data berhasil diekspor.");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal mengekspor data.");
		},
	});
}
