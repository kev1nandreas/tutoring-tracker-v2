"use client";

import Dialog from "@mui/material/Dialog";
import { X } from "lucide-react";
import * as React from "react";
import toast from "react-hot-toast";
import { fetchAttachmentDownload } from "@/services/api/main/attachment";
import type { Attachment, AttachmentDownload } from "@/types/attachment";

type Preview = { kind: "picture" | "video"; url: string; name: string };

/** Saves a file with its own name without leaving the page (the link sends it as a download). */
function startDownload(url: string, name: string) {
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
}

/**
 * Opens attachments the way each type should open: pictures and videos in a viewer
 * on the page, PDFs in a new tab, everything else as a download. Render `viewer` once.
 */
export function useAttachmentOpener() {
	const [preview, setPreview] = React.useState<Preview | null>(null);
	const [busyId, setBusyId] = React.useState<string | null>(null);

	const open = React.useCallback(async (a: Attachment) => {
		const wantsTab = a.type === "book" && a.content_type === "application/pdf";
		// a tab must be opened inside the click, before the await, or popup blockers stop it
		const tab = wantsTab ? window.open("", "_blank") : null;
		if (tab) tab.opener = null;

		setBusyId(a.id);
		try {
			const link: AttachmentDownload = await fetchAttachmentDownload(
				a.id,
				true,
			);

			if (a.type === "picture" && link.inline)
				setPreview({ kind: "picture", url: link.url, name: a.name });
			else if (a.type === "video" && link.inline)
				setPreview({ kind: "video", url: link.url, name: a.name });
			else if (tab && link.inline) tab.location.href = link.url;
			else if (a.external)
				window.open(link.url, "_blank", "noopener,noreferrer");
			else startDownload(link.url, a.name);
		} catch (e) {
			tab?.close();
			toast.error(e instanceof Error ? e.message : "Could not open the file.");
		} finally {
			setBusyId(null);
		}
	}, []);

	const download = React.useCallback(async (a: Attachment) => {
		setBusyId(a.id);
		try {
			const link = await fetchAttachmentDownload(a.id, false);
			if (a.external) window.open(link.url, "_blank", "noopener,noreferrer");
			else startDownload(link.url, a.name);
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Could not download the file.",
			);
		} finally {
			setBusyId(null);
		}
	}, []);

	const viewer = (
		<Dialog
			open={preview !== null}
			onClose={() => setPreview(null)}
			maxWidth="lg"
			fullWidth
			slotProps={{ paper: { sx: { overflow: "hidden", bgcolor: "#0b1020" } } }}
		>
			<div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2.5">
				<p className="truncate text-sm font-medium text-white">
					{preview?.name}
				</p>
				<button
					type="button"
					onClick={() => setPreview(null)}
					aria-label="Close"
					className="shrink-0 rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
				>
					<X size={18} aria-hidden />
				</button>
			</div>
			<div className="flex max-h-[80vh] min-h-[200px] items-center justify-center bg-black">
				{preview?.kind === "picture" && (
					// biome-ignore lint/performance/noImgElement: short-lived signed URL, not optimisable
					<img
						src={preview.url}
						alt={preview.name}
						className="max-h-[80vh] max-w-full object-contain"
					/>
				)}
				{preview?.kind === "video" && (
					<video
						src={preview.url}
						controls
						autoPlay
						playsInline
						controlsList="nodownload noremoteplayback"
						disablePictureInPicture
						className="max-h-[80vh] w-full"
					>
						<track kind="captions" />
					</video>
				)}
			</div>
		</Dialog>
	);

	return { open, download, busyId, viewer };
}
