export type BundleStatusName =
	| "queued"
	| "preparing"
	| "ready"
	| "failed"
	| "expired";

/** A "download everything" request (POST /me/tutorials/:id/bundle, GET /me/bundles/:id). */
export type BundleRequest = {
	id: string;
	status: BundleStatusName;
	file_count: number;
	total_bytes: number;
	error?: string;
	expires_at?: string;
	/** Short-lived link, only while ready. Path only: add the API origin. */
	download_url?: string;
};
