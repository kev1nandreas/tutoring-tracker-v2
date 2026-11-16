"use client";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { AlertCircle, Check, CloudUpload, Loader2, X } from "lucide-react";
import * as React from "react";
import { useDropzone } from "react-dropzone";
import AttachmentIcon from "@/components/attachments/AttachmentIcon";
import Button from "@/components/button/Button";
import clsxm from "@/lib/clsxm";
import { formatBytes } from "@/lib/helper";
import {
	ATTACHMENT_LABEL,
	ATTACHMENT_TYPES,
	type AttachmentType,
} from "@/types/attachment";
import { type UploadItem, useUploadQueue } from "../../_hooks/useUploadQueue";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	meetingId: string;
	meetingTitle: string;
};

function Bar({
	percent,
	tone,
}: {
	percent: number;
	tone: "brand" | "green" | "red";
}) {
	return (
		<div
			role="progressbar"
			aria-valuenow={percent}
			aria-valuemin={0}
			aria-valuemax={100}
			className="h-1.5 overflow-hidden rounded-full bg-gray-100"
		>
			<div
				className={clsxm(
					"h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none",
					tone === "green"
						? "bg-green-500"
						: tone === "red"
							? "bg-red-500"
							: "bg-brand-600",
				)}
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

function FileRow({
	item,
	problem,
	locked,
	onType,
	onRemove,
}: {
	item: UploadItem;
	problem: string | null;
	locked: boolean;
	onType: (t: AttachmentType) => void;
	onRemove: () => void;
}) {
	const percent =
		item.file.size === 0
			? 0
			: Math.min(100, Math.round((item.loaded / item.file.size) * 100));
	const busy = item.status === "uploading" || item.status === "saving";
	const done = item.status === "done";
	const failed = item.status === "error";
	const showBar = busy || item.status === "uploaded" || done || failed;

	return (
		<li className="flex items-start gap-3 py-3">
			<AttachmentIcon type={item.type} />

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-gray-900">
							{item.file.name}
						</p>
						<p className="text-xs text-gray-500">
							{formatBytes(item.file.size)}
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						{!done && (
							<select
								value={item.type}
								onChange={(e) => onType(e.target.value as AttachmentType)}
								disabled={locked || busy}
								aria-label={`Type of ${item.file.name}`}
								className="rounded-md border border-gray-300 bg-white py-1 pr-6 pl-2 text-xs text-gray-800 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:bg-gray-50 disabled:text-gray-400"
							>
								{ATTACHMENT_TYPES.map((t) => (
									<option key={t} value={t}>
										{ATTACHMENT_LABEL[t]}
									</option>
								))}
							</select>
						)}
						{done ? (
							<Check
								size={18}
								className="text-green-600"
								aria-label="Uploaded"
							/>
						) : busy ? (
							<Loader2
								size={18}
								className="animate-spin text-brand-600 motion-reduce:animate-none"
								aria-label="Working"
							/>
						) : (
							<button
								type="button"
								onClick={onRemove}
								disabled={locked}
								aria-label={`Remove ${item.file.name}`}
								className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-40"
							>
								<X size={16} aria-hidden />
							</button>
						)}
					</div>
				</div>

				{showBar && (
					<div className="mt-2">
						<Bar
							percent={
								done || item.status === "uploaded" || item.status === "saving"
									? 100
									: percent
							}
							tone={done ? "green" : failed ? "red" : "brand"}
						/>
						<p
							className={clsxm(
								"mt-1 text-xs",
								failed ? "text-red-600" : "text-gray-500",
							)}
						>
							{failed
								? item.error
								: item.note
									? item.note
									: done
										? "Uploaded"
										: item.status === "saving"
											? "Saving…"
											: item.status === "uploaded"
												? "Uploaded, saving…"
												: `Uploading ${percent}%`}
						</p>
					</div>
				)}

				{problem && item.status !== "done" && (
					<p className="mt-1 flex items-start gap-1 text-xs text-red-600">
						<AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden />
						{problem}
					</p>
				)}
			</div>
		</li>
	);
}

/** Pick files, set a type for each, and watch them upload with progress. */
export default function UploadAttachmentsDialog({
	isOpen,
	onClose,
	meetingId,
	meetingTitle,
}: Props) {
	const q = useUploadQueue(meetingId);

	// start fresh every time the dialog opens
	const { reset } = q;
	React.useEffect(() => {
		if (isOpen) reset();
	}, [isOpen, reset]);

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop: q.add,
		disabled: q.isRunning,
		noClick: true,
		noKeyboard: true,
	});

	const blocking = q.items.some(
		(it) => it.status !== "done" && q.problemOf(it),
	);
	const allDone =
		q.items.length > 0 && q.items.every((it) => it.status === "done");
	const pending = q.items.filter((it) => it.status !== "done").length;

	const handleClose = () => {
		if (q.isRunning) return;
		onClose();
	};

	return (
		<Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>
				Upload materials
				<span className="mt-0.5 block text-sm font-normal text-gray-500">
					{meetingTitle}
				</span>
			</DialogTitle>

			<DialogContent>
				<div
					{...getRootProps()}
					className={clsxm(
						"flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
						isDragActive
							? "border-brand-500 bg-brand-50"
							: "border-gray-300 bg-gray-50",
						q.isRunning && "opacity-50",
					)}
				>
					<input {...getInputProps()} aria-label="Choose files to upload" />
					<CloudUpload size={28} className="text-brand-600" aria-hidden />
					<p className="text-sm text-gray-700">Drag files here</p>
					<Button
						variant="outline"
						size="sm"
						onClick={open}
						disabled={q.isRunning}
					>
						Choose files
					</Button>
					<p className="max-w-xs text-xs text-gray-500">
						Presentations, pictures, books, videos or other files. We pick a
						type for each file; change it if it is wrong.
					</p>
				</div>

				{q.items.length > 0 && (
					<ul className="mt-3 divide-y divide-gray-100">
						{q.items.map((it) => (
							<FileRow
								key={it.id}
								item={it}
								problem={q.problemOf(it)}
								locked={q.isRunning}
								onType={(t) => q.setType(it.id, t)}
								onRemove={() => q.remove(it.id)}
							/>
						))}
					</ul>
				)}
			</DialogContent>

			{q.items.length > 0 && (
				<div className="mx-6 mb-1 rounded-lg bg-gray-50 px-4 py-3">
					<div className="mb-1.5 flex items-baseline justify-between text-xs text-gray-600">
						<span>
							{allDone
								? "All files uploaded"
								: q.isRunning
									? "Uploading…"
									: `${pending} ${pending === 1 ? "file" : "files"} ready`}
						</span>
						<span className="font-medium tabular-nums">
							{formatBytes(q.sentBytes)} / {formatBytes(q.totalBytes)} ·{" "}
							{q.percent}%
						</span>
					</div>
					<Bar percent={q.percent} tone={allDone ? "green" : "brand"} />
				</div>
			)}
			<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
				{q.isRunning ? (
					<Button variant="outline" onClick={q.cancel}>
						Cancel upload
					</Button>
				) : (
					<Button variant="outline" onClick={handleClose}>
						{allDone ? "Close" : "Cancel"}
					</Button>
				)}
				{!allDone && (
					<Button
						variant="brand"
						onClick={q.start}
						disabled={!q.canStart || blocking}
						isLoading={q.isRunning}
					>
						{q.items.some((it) => it.status === "error")
							? "Retry"
							: `Upload${pending > 0 ? ` ${pending} ${pending === 1 ? "file" : "files"}` : ""}`}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
