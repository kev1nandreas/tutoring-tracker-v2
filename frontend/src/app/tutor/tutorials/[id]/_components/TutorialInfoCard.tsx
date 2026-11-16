import {
	Check,
	Download,
	type LucideIcon,
	MessageSquareText,
	UserCheck,
} from "lucide-react";
import Typography from "@/components/Typography";
import clsxm from "@/lib/clsxm";
import { formatShortDate } from "@/lib/helper";
import type { Tutorial } from "@/types/tutorial";

type AccessKey = "show_download" | "show_attendance" | "show_feedback";

const ACCESS: {
	key: AccessKey;
	label: string;
	hint: string;
	icon: LucideIcon;
}[] = [
	{
		key: "show_download",
		label: "Download everything",
		hint: "Everything as one zip",
		icon: Download,
	},
	{
		key: "show_attendance",
		label: "Attendance",
		hint: "Their own attendance",
		icon: UserCheck,
	},
	{
		key: "show_feedback",
		label: "Feedback",
		hint: "Feedback and marks",
		icon: MessageSquareText,
	},
];

/** What the "download everything" package holds, as the tutor configured it. */
function packageHint(t: Tutorial) {
	const extras = [
		t.bundle_include_homework && "homework",
		t.bundle_include_recordings && "recording links",
	].filter(Boolean);
	return `Zip with summary PDF${extras.length ? `, incl. ${extras.join(" and ")}` : ""}`;
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4">
			<dt className="text-gray-500">{label}</dt>
			<dd className="text-right font-medium text-gray-900">{value}</dd>
		</div>
	);
}

export default function TutorialInfoCard({ tutorial }: { tutorial: Tutorial }) {
	return (
		<aside className="rounded-xl border border-gray-200 bg-white lg:sticky lg:top-20">
			<h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
				Tutorial details
			</h2>

			<dl className="flex flex-col gap-3 px-5 py-4 text-sm">
				<Row label="Code" value={tutorial.custom_id} />
				<Row label="Starts" value={formatShortDate(tutorial.date_started)} />
				<Row label="Ends" value={formatShortDate(tutorial.date_ended)} />
				<Row label="Created" value={formatShortDate(tutorial.created_at)} />
			</dl>

			<div className="border-t border-gray-100 px-5 py-4">
				<Typography weight="medium" className="text-sm text-gray-900">
					Students can see
				</Typography>
				<ul className="mt-3 flex flex-col gap-2.5">
					{ACCESS.map(({ key, label, hint, icon: Icon }) => {
						const on = tutorial[key];
						return (
							<li key={key} className="flex items-center gap-3">
								<span
									className={clsxm(
										"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
										on
											? "bg-brand-50 text-brand-700"
											: "bg-gray-100 text-gray-400",
									)}
								>
									<Icon size={16} aria-hidden />
								</span>
								<div className="min-w-0 flex-1">
									<p
										className={clsxm(
											"text-sm font-medium",
											on ? "text-gray-900" : "text-gray-400",
										)}
									>
										{label}
									</p>
									<p className="text-xs text-gray-500">
										{key === "show_download" && on
											? packageHint(tutorial)
											: hint}
									</p>
								</div>
								{on ? (
									<span className="flex items-center gap-1 text-xs font-medium text-green-700">
										<Check size={14} aria-hidden /> On
									</span>
								) : (
									<span className="text-xs text-gray-400">Off</span>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</aside>
	);
}
