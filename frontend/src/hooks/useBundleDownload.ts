import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/errors";
import {
	bundleDownloadHref,
	fetchBundleStatus,
	requestBundle,
} from "@/services/api/main/bundle";
import type { BundleRequest } from "@/types/bundle";

const POLL_MS = 2000;
const WORKING = ["queued", "preparing"];

/**
 * "Download everything" for one class: ask for it, poll while it is prepared, then let the
 * user start the download. The zip is built while it downloads; nothing is stored.
 * Students use the default request; a tutor passes their own (with the contents they picked).
 */
export function useBundleDownload(
	tutorialId: string,
	ask: () => Promise<BundleRequest> = () => requestBundle(tutorialId),
) {
	const [requestId, setRequestId] = React.useState<string | null>(null);
	const announced = React.useRef<string | null>(null);

	const request = useMutation({
		mutationFn: ask,
		onSuccess: (data) => setRequestId(data.id),
		onError: (error: Error) => toast.error(error.message),
	});

	const status = useQuery({
		queryKey: ["bundle", requestId],
		queryFn: () => fetchBundleStatus(requestId as string),
		enabled: requestId !== null,
		// keep checking while the job runs, then stop
		refetchInterval: (query) =>
			WORKING.includes(query.state.data?.status ?? "queued") ? POLL_MS : false,
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 3,
	});

	const current: BundleRequest | undefined = status.data ?? request.data;

	// say it once when it turns ready or fails
	React.useEffect(() => {
		if (!current || announced.current === `${current.id}:${current.status}`)
			return;
		if (current.status === "ready") toast.success("Your download is ready.");
		if (current.status === "failed")
			toast.error(current.error || "The download could not be prepared.");
		if (current.status === "ready" || current.status === "failed")
			announced.current = `${current.id}:${current.status}`;
	}, [current]);

	/** Fetches a fresh link (they expire after 10 minutes) and starts the browser download. */
	const download = useMutation({
		mutationFn: async () => {
			const fresh = await fetchBundleStatus(requestId as string);
			if (fresh.status !== "ready" || !fresh.download_url)
				throw new Error(
					"This download is no longer available. Prepare it again.",
				);
			return fresh.download_url;
		},
		onSuccess: (path) => {
			const a = document.createElement("a");
			a.href = bundleDownloadHref(path);
			a.rel = "noopener";
			document.body.appendChild(a);
			a.click();
			a.remove();
			toast.success("Your download started.");
		},
		onError: (error: Error) => {
			toast.error(error.message);
			status.refetch();
		},
	});

	return {
		current,
		isRequesting: request.isPending,
		isDownloading: download.isPending,
		start: () => request.mutate(),
		download: () => download.mutate(),
		reset: () => {
			setRequestId(null);
			request.reset();
		},
	};
}
