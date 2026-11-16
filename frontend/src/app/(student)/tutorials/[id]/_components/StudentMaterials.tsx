"use client";

import { Download } from "lucide-react";
import AttachmentIcon from "@/components/attachments/AttachmentIcon";
import { useAttachmentOpener } from "@/components/attachments/useAttachmentOpener";
import { useMeetingAttachments } from "@/hooks/useMeetingAttachments";
import { ApiError } from "@/lib/errors";
import { formatBytes } from "@/lib/helper";
import { ATTACHMENT_LABEL } from "@/types/attachment";

/** A meeting's files for a student: pictures and videos open on the page, PDFs in a tab, the rest download. */
export default function StudentMaterials({ meetingId }: { meetingId: string }) {
	const { data, isLoading, isError, error } = useMeetingAttachments(meetingId);
	const { open, download, busyId, viewer } = useAttachmentOpener();

	if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;

	if (isError) {
		// 403: the tutor chose not to share files for this class
		const notShared = error instanceof ApiError && error.status === 403;
		return (
			<p className="text-sm text-gray-400">
				{notShared
					? "Your tutor has not shared files for this class."
					: "Could not load the files."}
			</p>
		);
	}

	const items = data ?? [];
	if (items.length === 0)
		return (
			<p className="text-sm text-gray-400">No files for this meeting yet.</p>
		);

	return (
		<>
			<ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
				{items.map((a) => (
					<li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
						<AttachmentIcon type={a.type} className="h-9 w-9" />
						<div className="min-w-0 flex-1">
							<button
								type="button"
								onClick={() => open(a)}
								disabled={busyId === a.id}
								className="block max-w-full truncate rounded text-left text-sm font-medium text-gray-900 hover:text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-60"
							>
								{a.name}
							</button>
							<p className="text-xs text-gray-500">
								{ATTACHMENT_LABEL[a.type]} · {formatBytes(a.size)}
							</p>
						</div>
						<button
							type="button"
							onClick={() => download(a)}
							disabled={busyId === a.id}
							aria-label={`Download ${a.name}`}
							className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-60"
						>
							<Download size={16} aria-hidden />
						</button>
					</li>
				))}
			</ul>
			{viewer}
		</>
	);
}
