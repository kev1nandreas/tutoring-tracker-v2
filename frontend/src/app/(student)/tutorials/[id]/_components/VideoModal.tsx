"use client";

import Dialog from "@mui/material/Dialog";
import { X } from "lucide-react";

type Props = {
	/** YouTube video id, or null while closed. */
	videoId: string | null;
	title: string;
	onClose: () => void;
};

// Built only from an 11-character id, never from a link. Nocookie host, no
// related videos, little branding, no annotations.
const embedUrl = (id: string) =>
	`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;

/**
 * Plays a recording inside the app. The iframe is sandboxed WITHOUT allow-popups
 * and allow-top-navigation, so the "Watch on YouTube" title and logo cannot open
 * youtube.com, and the page never links to it. (Anyone determined can still find
 * the video id in the network tab; this stops the casual route, not a developer.)
 */
export default function VideoModal({ videoId, title, onClose }: Props) {
	return (
		<Dialog
			open={videoId !== null}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{ paper: { sx: { overflow: "hidden", bgcolor: "#000" } } }}
		>
			<div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2.5">
				<p className="truncate text-sm font-medium text-white">{title}</p>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close video"
					className="shrink-0 rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
				>
					<X size={18} aria-hidden />
				</button>
			</div>

			<div className="relative aspect-video w-full">
				{videoId && (
					<iframe
						key={videoId}
						src={embedUrl(videoId)}
						title={`Recording: ${title}`}
						className="absolute inset-0 h-full w-full border-0"
						sandbox="allow-scripts allow-same-origin allow-presentation"
						allow="encrypted-media; picture-in-picture; fullscreen"
						allowFullScreen
						referrerPolicy="strict-origin-when-cross-origin"
						loading="lazy"
					/>
				)}
			</div>
		</Dialog>
	);
}
