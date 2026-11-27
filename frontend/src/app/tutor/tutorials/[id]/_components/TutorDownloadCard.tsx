"use client";

import Switch from "@mui/material/Switch";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	Loader2,
	PackageOpen,
} from "lucide-react";
import { useState } from "react";
import Button from "@/components/button/Button";
import { useBundleDownload } from "@/hooks/useBundleDownload";
import { formatBytes } from "@/lib/helper";
import { requestTutorBundle } from "@/services/api/main/bundle";
import type { BundleOptions } from "@/types/bundle";
import type { Tutorial } from "@/types/tutorial";

const TOGGLES: { key: keyof BundleOptions; label: string; hint: string }[] = [
	{
		key: "include_attachments",
		label: "Attachments",
		hint: "Files of every meeting, in a folder each",
	},
	{
		key: "include_homework",
		label: "Homework",
		hint: "Homework of every meeting, in the summary PDF",
	},
	{
		key: "include_recordings",
		label: "Links",
		hint: "Recording links, in the summary PDF",
	},
];

/**
 * The tutor's own "download everything": always available, whatever students may see,
 * with the contents picked here. The zip looks the same as a student's.
 */
export default function TutorDownloadCard({
	tutorial,
}: {
	tutorial: Tutorial;
}) {
	// start from what the tutor set up for students
	const [options, setOptions] = useState<BundleOptions>({
		include_attachments: true,
		include_homework: tutorial.bundle_include_homework,
		include_recordings: tutorial.bundle_include_recordings,
	});
	const b = useBundleDownload(tutorial.id, () =>
		requestTutorBundle(tutorial.id, options),
	);
	const status = b.current?.status;
	const working =
		b.isRequesting || status === "queued" || status === "preparing";

	const toggle = (key: keyof BundleOptions, on: boolean) => {
		setOptions((o) => ({ ...o, [key]: on }));
		// a prepared package no longer matches: prepare again with the new contents
		if (b.current && !working) b.reset();
	};

	return (
		<section className="rounded-xl border border-gray-200 bg-white">
			<h2 className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
				<PackageOpen size={18} className="text-brand-700" aria-hidden />
				Download everything
			</h2>

			<ul className="flex flex-col gap-1 border-b border-gray-100 px-5 py-3">
				{TOGGLES.map(({ key, label, hint }) => (
					<li key={key} className="flex items-center justify-between gap-3">
						<label htmlFor={`bundle-${key}`} className="min-w-0 cursor-pointer">
							<span className="block text-sm font-medium text-gray-900">
								{label}
							</span>
							<span className="block text-xs text-gray-500">{hint}</span>
						</label>
						<Switch
							id={`bundle-${key}`}
							checked={options[key]}
							disabled={working}
							onChange={(e) => toggle(key, e.target.checked)}
						/>
					</li>
				))}
			</ul>

			<div className="flex flex-col gap-3 px-5 py-4">
				{working ? (
					<output className="flex flex-col gap-2.5">
						<p className="flex items-center gap-2 text-sm font-medium text-gray-900">
							<Loader2
								size={16}
								className="animate-spin text-brand-600 motion-reduce:animate-none"
								aria-hidden
							/>
							{status === "preparing"
								? "Preparing your download…"
								: "Waiting in line…"}
						</p>
						<div
							className="relative h-1.5 overflow-hidden rounded-full bg-gray-100"
							aria-hidden
						>
							<div className="absolute inset-y-0 w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-brand-600 motion-reduce:animate-none" />
						</div>
						<p className="text-xs text-gray-500">
							You can leave this page. We will notify you when it is ready.
						</p>
					</output>
				) : status === "ready" ? (
					<>
						<p className="flex items-start gap-2 text-sm text-gray-900">
							<CheckCircle2
								size={18}
								className="mt-0.5 shrink-0 text-green-600"
								aria-hidden
							/>
							<span>
								Ready: {b.current?.file_count}{" "}
								{b.current?.file_count === 1 ? "file" : "files"}
								{b.current ? `, ${formatBytes(b.current.total_bytes)}` : ""},
								with a summary PDF.
							</span>
						</p>
						<Button
							variant="brand"
							leftIcon={Download}
							isLoading={b.isDownloading}
							onClick={b.download}
						>
							Download zip
						</Button>
						<p className="flex items-center gap-1.5 text-xs text-gray-500">
							<Clock size={12} aria-hidden /> Available for about an hour.
						</p>
					</>
				) : status === "failed" || status === "expired" ? (
					<>
						<p
							role="alert"
							className="flex items-start gap-2 text-sm text-red-700"
						>
							<AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
							{status === "expired"
								? "This download expired."
								: b.current?.error || "It could not be prepared."}
						</p>
						<Button variant="outline" onClick={b.start}>
							Try again
						</Button>
					</>
				) : (
					<>
						<p className="text-sm leading-relaxed text-gray-600">
							Get this class as one zip with a PDF summary of all meetings,
							whether or not students can download it.
						</p>
						<Button variant="brand" leftIcon={PackageOpen} onClick={b.start}>
							Prepare download
						</Button>
					</>
				)}
			</div>
		</section>
	);
}
