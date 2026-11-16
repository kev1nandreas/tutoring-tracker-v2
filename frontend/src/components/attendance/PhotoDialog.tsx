"use client";

import Dialog from "@mui/material/Dialog";
import { X } from "lucide-react";

type Props = { url: string | null; title: string; onClose: () => void };

/** Shows one photo large, in a dialog. Pass null to close it. */
export default function PhotoDialog({ url, title, onClose }: Props) {
	return (
		<Dialog
			open={url !== null}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{ paper: { sx: { overflow: "hidden", bgcolor: "#0b1020" } } }}
		>
			<div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2.5">
				<p className="truncate text-sm font-medium text-white">{title}</p>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="shrink-0 rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
				>
					<X size={18} aria-hidden />
				</button>
			</div>
			<div className="flex max-h-[80vh] items-center justify-center bg-black">
				{url && (
					// biome-ignore lint/performance/noImgElement: short-lived signed URL, not optimisable
					<img
						src={url}
						alt={title}
						className="max-h-[80vh] max-w-full object-contain"
					/>
				)}
			</div>
		</Dialog>
	);
}
