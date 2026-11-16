export const ATTACHMENT_TYPES = [
	"ppt",
	"picture",
	"book",
	"video",
	"other",
] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const ATTACHMENT_LABEL: Record<AttachmentType, string> = {
	ppt: "Presentation",
	picture: "Picture",
	book: "Book",
	video: "Video",
	other: "Other",
};

const MB = 1024 * 1024;

/** Largest file per category. Mirrors the backend, which is the one that enforces it. */
export const ATTACHMENT_MAX_BYTES: Record<AttachmentType, number> = {
	ppt: 100 * MB,
	picture: 25 * MB,
	book: 200 * MB,
	video: 1024 * MB,
	other: 100 * MB,
};

/** Extensions per category (lower-case, with the dot). "other" takes anything not blocked. */
export const ATTACHMENT_EXTENSIONS: Record<
	Exclude<AttachmentType, "other">,
	string[]
> = {
	ppt: [".ppt", ".pps", ".pptx", ".ppsx", ".odp", ".key"],
	picture: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
	book: [".pdf", ".epub", ".mobi"],
	video: [".mp4", ".m4v", ".webm", ".mov", ".mkv"],
};

const BLOCKED_OTHER = [
	".exe",
	".msi",
	".bat",
	".cmd",
	".com",
	".scr",
	".sh",
	".js",
	".mjs",
	".jar",
	".php",
	".html",
	".htm",
	".svg",
	".xhtml",
	".dll",
	".apk",
];

const extOf = (name: string) => {
	const i = name.lastIndexOf(".");
	return i < 0 ? "" : name.slice(i).toLowerCase();
};

/** Best category for a file name; "other" when unknown. */
export function detectAttachmentType(name: string): AttachmentType {
	const ext = extOf(name);
	for (const t of ["ppt", "picture", "book", "video"] as const) {
		if (ATTACHMENT_EXTENSIONS[t].includes(ext)) return t;
	}
	return "other";
}

/** Why `file` cannot be uploaded as `type`, or null when it is fine. */
export function attachmentProblem(
	file: { name: string; size: number },
	type: AttachmentType,
): string | null {
	const ext = extOf(file.name);
	if (type === "other") {
		if (!ext || BLOCKED_OTHER.includes(ext))
			return `Files of type "${ext || "none"}" are not allowed.`;
	} else if (!ATTACHMENT_EXTENSIONS[type].includes(ext)) {
		return `A ${ATTACHMENT_LABEL[type].toLowerCase()} cannot be ${ext || "a file without an extension"}. Pick another type.`;
	}
	if (file.size === 0) return "The file is empty.";
	if (file.size > ATTACHMENT_MAX_BYTES[type]) {
		return `Too large. A ${ATTACHMENT_LABEL[type].toLowerCase()} can be at most ${ATTACHMENT_MAX_BYTES[type] / MB} MB.`;
	}
	return null;
}

/** A file attached to a meeting. The storage key is never sent to the client. */
export type Attachment = {
	id: string;
	meeting_id: string;
	name: string;
	type: AttachmentType;
	content_type: string;
	size: number;
	/** Old rows that point at a web link instead of a stored file. */
	external: boolean;
	created_at: string;
};

export type UploadTicket = {
	upload_url: string;
	fields: Record<string, string>;
	key: string;
	content_type: string;
	expires_in: number;
};

export type AttachmentDownload = {
	url: string;
	name: string;
	type: AttachmentType;
	content_type: string;
	/** True when the browser can show it in place (image, video, PDF). */
	inline: boolean;
	expires_in: number;
};
