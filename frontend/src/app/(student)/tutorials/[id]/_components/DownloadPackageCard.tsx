"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	Loader2,
	PackageOpen,
} from "lucide-react";
import Button from "@/components/button/Button";
import { useBundleDownload } from "@/hooks/useBundleDownload";
import { formatBytes } from "@/lib/helper";
import type { EnrolledTutorial } from "@/types/student-tutorial";

/** "Download everything": all files of the class by meeting, plus a summary PDF, as one zip. */
export default function DownloadPackageCard({
	tutorial,
}: {
	tutorial: EnrolledTutorial;
}) {
	const b = useBundleDownload(tutorial.id);
	const status = b.current?.status;
	const working =
		b.isRequesting || status === "queued" || status === "preparing";

	// the tutor turned it off: there is nothing to show
	if (!tutorial.can_download) return null;

	return (
		<section className="rounded-xl border border-gray-200 bg-white">
			<h2 className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
				<PackageOpen size={18} className="text-brand-700" aria-hidden />{" "}
				Download everything
			</h2>

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
						{/* the job gives no percentage, so the bar only shows that something is running */}
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
							Get every file of this class, in a folder for each meeting, with a
							PDF summary of all meetings.
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
