"use client";

import { Download, Trash2, Upload } from "lucide-react";
import * as React from "react";
import AttachmentIcon from "@/components/attachments/AttachmentIcon";
import { useAttachmentOpener } from "@/components/attachments/useAttachmentOpener";
import Button from "@/components/button/Button";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import { useMeetingAttachments } from "@/hooks/useMeetingAttachments";
import { formatBytes, formatShortDate } from "@/lib/helper";
import { ATTACHMENT_LABEL, type Attachment } from "@/types/attachment";
import { useDeleteAttachment } from "../../_hooks/useMeetingAttachments";
import UploadAttachmentsDialog from "./UploadAttachmentsDialog";

type Props = { meetingId: string; meetingTitle: string };

/** A meeting's files for the tutor: open, download, delete, and upload new ones. */
export default function MeetingMaterials({ meetingId, meetingTitle }: Props) {
	const { data, isLoading, isError, error, refetch } =
		useMeetingAttachments(meetingId);
	const { open, download, busyId, viewer } = useAttachmentOpener();
	const remove = useDeleteAttachment(meetingId);
	const [isUploadOpen, setIsUploadOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<Attachment | null>(null);

	const items = data ?? [];

	return (
		<div>
			<div className="mb-3 flex items-center justify-between gap-3">
				<p className="text-xs text-gray-500">
					{isLoading
						? "Loading…"
						: items.length === 0
							? "Nothing uploaded yet."
							: `${items.length} ${items.length === 1 ? "file" : "files"}`}
				</p>
				<Button
					variant="brand"
					size="sm"
					leftIcon={Upload}
					onClick={() => setIsUploadOpen(true)}
				>
					Upload
				</Button>
			</div>

			{isError ? (
				<div
					role="alert"
					className="flex items-center justify-between gap-3 text-sm text-red-700"
				>
					{error.message}
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						Try again
					</Button>
				</div>
			) : (
				items.length > 0 && (
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
										{ATTACHMENT_LABEL[a.type]} · {formatBytes(a.size)} ·{" "}
										{formatShortDate(a.created_at)}
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
								<button
									type="button"
									onClick={() => setToDelete(a)}
									aria-label={`Delete ${a.name}`}
									className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand-600"
								>
									<Trash2 size={16} aria-hidden />
								</button>
							</li>
						))}
					</ul>
				)
			)}

			<UploadAttachmentsDialog
				isOpen={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				meetingId={meetingId}
				meetingTitle={meetingTitle}
			/>
			<ConfirmationDialog
				isOpen={toDelete !== null}
				setIsOpen={(isOpen) => !isOpen && setToDelete(null)}
				message={`Delete "${toDelete?.name ?? ""}"? Students will no longer see it.`}
				confirmLabel="Delete"
				cancelLabel="Cancel"
				confirmVariant="red"
				onConfirm={() => toDelete && remove.mutate(toDelete.id)}
			/>
			{viewer}
		</div>
	);
}
