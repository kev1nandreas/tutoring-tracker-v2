export type BundleStatusName =
	| "queued"
	| "preparing"
	| "ready"
	| "failed"
	| "expired";

/** A "download everything" request (POST /me/tutorials/:id/bundle or /tutorials/:id/bundle, GET /me/bundles/:id). */
export type BundleRequest = {
	id: string;
	status: BundleStatusName;
	file_count: number;
	total_bytes: number;
	error?: string;
	expires_at?: string;
	/** Short-lived link, only while ready. Path only: add the API origin. */
	download_url?: string;
	/** What the package holds. */
	include_attachments: boolean;
	include_homework: boolean;
	include_recordings: boolean;
};

/** What a tutor picks for their own download (POST /tutorials/:id/bundle). */
export type BundleOptions = {
	include_attachments: boolean;
	include_homework: boolean;
	include_recordings: boolean;
};
