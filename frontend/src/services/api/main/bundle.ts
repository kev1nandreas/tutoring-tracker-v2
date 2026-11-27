import { ENV } from "@/configs/environment";
import { ApiError } from "@/lib/errors";
import { get, post } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { BundleOptions, BundleRequest } from "@/types/bundle";

function fail(Kind: unknown, StatusCode: number, fallback: string): never {
	if (StatusCode === 429)
		throw new ApiError("Too many requests. Please wait a moment.", 429);
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, StatusCode);
}

/** Ask for the package. If one is already queued or ready, that one comes back. */
export async function requestBundle(tutorialId: string) {
	const { OK, Kind, StatusCode } = await post<MainResponse<BundleRequest>>(
		MAIN_ENDPOINT.Bundle.Request(tutorialId),
		{},
	);
	if (!OK) fail(Kind, StatusCode, "Could not start the download.");
	return (Kind as MainResponse<BundleRequest>).data as BundleRequest;
}

/** The tutor's own package, with the contents they picked. Works with student downloads off. */
export async function requestTutorBundle(
	tutorialId: string,
	options: BundleOptions,
) {
	const { OK, Kind, StatusCode } = await post<MainResponse<BundleRequest>>(
		MAIN_ENDPOINT.Bundle.TutorRequest(tutorialId),
		options,
	);
	if (!OK) fail(Kind, StatusCode, "Could not start the download.");
	return (Kind as MainResponse<BundleRequest>).data as BundleRequest;
}

export async function fetchBundleStatus(id: string) {
	const { OK, Kind, StatusCode } = await get<MainResponse<BundleRequest>>(
		MAIN_ENDPOINT.Bundle.Status(id),
	);
	if (!OK) fail(Kind, StatusCode, "Could not check the download.");
	return (Kind as MainResponse<BundleRequest>).data as BundleRequest;
}

/** Full address of a download link: the browser opens it directly, so it needs the API origin. */
export const bundleDownloadHref = (path: string) =>
	new URL(path, new URL(ENV.URI.BASE_URL).origin).toString();
