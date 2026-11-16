"use client";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { CircleAlert, Download, FileSpreadsheet } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import { formatBytes } from "@/lib/helper";
import { ScheduleImportError } from "@/services/api/main/schedule-import";
import {
	useScheduleImport,
	useScheduleTemplateDownload,
} from "../_hooks/useScheduleImport";

type Props = { isOpen: boolean; onClose: () => void; tutorialId: string };

const MAX_BYTES = 1024 * 1024;

export default function ImportScheduleDialog({
	isOpen,
	onClose,
	tutorialId,
}: Props) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [file, setFile] = React.useState<File | null>(null);
	const [fileError, setFileError] = React.useState<string | null>(null);

	const template = useScheduleTemplateDownload();
	const importer = useScheduleImport(tutorialId, { onSuccess: () => close() });

	const rowErrors =
		importer.error instanceof ScheduleImportError ? importer.error.rows : [];

	function close() {
		setFile(null);
		setFileError(null);
		importer.reset();
		onClose();
	}

	function pick(next: File | undefined) {
		importer.reset();
		setFileError(null);
		if (!next) return setFile(null);
		if (!next.name.toLowerCase().endsWith(".xlsx")) {
			setFile(null);
			return setFileError("Choose an Excel file (.xlsx).");
		}
		if (next.size > MAX_BYTES) {
			setFile(null);
			return setFileError("The file is larger than 1 MB.");
		}
		setFile(next);
	}

	return (
		<Dialog open={isOpen} onClose={close} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>
				Import schedule from Excel
			</DialogTitle>
			<DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				<ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
					<li>Download the template.</li>
					<li>
						Fill in one meeting per row: <b>Date</b>, <b>Time range</b> (like
						16:00-17:30) and <b>Material (title)</b>.
					</li>
					<li>Upload the file here.</li>
				</ol>

				<div>
					<Button
						variant="outline"
						size="sm"
						leftIcon={Download}
						isLoading={template.isPending}
						onClick={() => template.mutate()}
					>
						Download template
					</Button>
				</div>

				<div className="rounded-lg border border-dashed border-gray-300 p-4">
					<input
						ref={inputRef}
						type="file"
						accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						className="sr-only"
						aria-label="Schedule file (.xlsx)"
						onChange={(e) => pick(e.target.files?.[0])}
					/>
					{file ? (
						<div className="flex items-center gap-3">
							<FileSpreadsheet
								className="shrink-0 text-green-600"
								size={28}
								aria-hidden
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-gray-900">
									{file.name}
								</p>
								<p className="text-xs text-gray-500">
									{formatBytes(file.size)}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => inputRef.current?.click()}
							>
								Change
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 py-2">
							<p className="text-sm text-gray-500">No file chosen</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => inputRef.current?.click()}
							>
								Choose .xlsx file
							</Button>
						</div>
					)}
				</div>

				{fileError && (
					<p role="alert" className="text-sm text-red-700">
						{fileError}
					</p>
				)}

				{rowErrors.length > 0 && (
					<div
						role="alert"
						className="rounded-lg border border-red-200 bg-red-50 p-3"
					>
						<p className="flex items-center gap-2 text-sm font-semibold text-red-800">
							<CircleAlert size={16} aria-hidden />
							Nothing was imported. Fix these rows and upload again:
						</p>
						<ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-red-800">
							{rowErrors.map((e) => (
								<li key={`${e.row}-${e.message}`}>
									<b>Row {e.row}:</b> {e.message}
								</li>
							))}
						</ul>
					</div>
				)}

				{importer.isError && rowErrors.length === 0 && (
					<p role="alert" className="text-sm text-red-700">
						{importer.error.message}
					</p>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
				<Button variant="outline" onClick={close}>
					Cancel
				</Button>
				<Button
					variant="brand"
					disabled={!file}
					isLoading={importer.isPending}
					onClick={() => file && importer.mutate(file)}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
}
