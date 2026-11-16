"use client";

import Drawer from "@mui/material/Drawer";
import { Clock, GraduationCap, Mail, Phone, School, X } from "lucide-react";
import Link from "next/link";
import Button from "@/components/button/Button";
import { formatRelativeTime, getInitials } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { StudentTutorial } from "@/types/tutor-student";
import { useStudentDetail } from "../_hooks/useStudents";

type Props = {
	/** User id of the student to show; null keeps the drawer closed. */
	studentId: string | null;
	onClose: () => void;
};

const STATUS: Record<
	StudentTutorial["status"],
	{ label: string; cls: string }
> = {
	accepted: { label: "Enrolled", cls: "bg-green-50 text-green-700" },
	pending: { label: "Waiting", cls: "bg-amber-50 text-amber-700" },
	declined: { label: "Rejected", cls: "bg-red-50 text-red-700" },
};

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
			<dd className="text-base font-bold tabular-nums text-gray-900">
				{value}
			</dd>
			<dt className="text-[11px] text-gray-500">{label}</dt>
		</div>
	);
}

function TutorialItem({ t }: { t: StudentTutorial }) {
	const s = STATUS[t.status];
	const enrolled = t.status === "accepted";
	return (
		<li className="rounded-xl border border-gray-200 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<Link
						href={`${PATH.TUTORIALS}/${t.tutorial_id}`}
						className="block truncate text-sm font-semibold text-gray-900 hover:text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						{t.name}
					</Link>
					<p className="text-xs text-gray-500">
						{t.custom_id}
						{t.is_done ? " · Done" : ""}
					</p>
				</div>
				<span
					className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
				>
					{s.label}
				</span>
			</div>
			{enrolled && (
				<dl className="mt-3 grid grid-cols-3 gap-2">
					<Stat label="Attended" value={`${t.attended}/${t.total_meetings}`} />
					<Stat label="Homework" value={String(t.submitted)} />
					<Stat
						label="Avg grade"
						value={t.avg_grade === null ? "–" : t.avg_grade.toFixed(0)}
					/>
				</dl>
			)}
		</li>
	);
}

/** Side panel with one student's contact details and progress in each of the tutor's tutorials. */
export default function StudentDrawer({ studentId, onClose }: Props) {
	const q = useStudentDetail(studentId);
	const s = q.data;

	return (
		<Drawer
			anchor="right"
			open={studentId !== null}
			onClose={onClose}
			slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 } } } }}
		>
			<div className="flex h-full flex-col">
				<header className="bg-graph flex items-start justify-between gap-3 border-b border-[#d8e0f0] px-6 py-5">
					<div className="flex min-w-0 items-center gap-3">
						<span
							aria-hidden
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base font-semibold text-brand-700 ring-1 ring-[#d8e0f0]"
						>
							{s ? getInitials(s.name) : ""}
						</span>
						<div className="min-w-0">
							<h2 className="truncate text-xl font-bold leading-snug text-brand-950">
								{s?.name ?? "Student"}
							</h2>
							{s && (
								<p className="truncate text-sm text-gray-600">@{s.username}</p>
							)}
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						<X size={18} aria-hidden />
					</button>
				</header>

				<div className="flex-1 overflow-y-auto">
					{q.isLoading ? (
						<div className="flex flex-col gap-3 p-6" aria-busy="true">
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className="h-16 animate-pulse rounded-lg bg-gray-100"
								/>
							))}
						</div>
					) : q.isError ? (
						<div
							role="alert"
							className="flex flex-col gap-3 p-6 text-sm text-red-700"
						>
							{q.error.message}
							<Button variant="outline" size="sm" onClick={() => q.refetch()}>
								Try again
							</Button>
						</div>
					) : s ? (
						<>
							<section className="px-6 py-5">
								<dl className="flex flex-col gap-3 text-sm">
									{[
										{ icon: Mail, label: "Email", v: s.email },
										{ icon: Phone, label: "Phone", v: s.phone },
										{ icon: School, label: "School", v: s.school },
										{
											icon: Clock,
											label: "Last login",
											v: s.last_login_at
												? formatRelativeTime(s.last_login_at)
												: "Never logged in",
										},
									].map(({ icon: Icon, label, v }) => (
										<div key={label} className="flex items-center gap-3">
											<Icon size={16} className="text-gray-400" aria-hidden />
											<dt className="sr-only">{label}</dt>
											<dd className="min-w-0 break-words text-gray-900">
												{v || "–"}
											</dd>
										</div>
									))}
								</dl>
							</section>
							<section className="border-t border-gray-100 px-6 py-5">
								<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
									<GraduationCap
										size={16}
										className="text-brand-700"
										aria-hidden
									/>
									Your tutorials
								</h3>
								<ul className="flex flex-col gap-3">
									{s.tutorials.map((t) => (
										<TutorialItem key={t.tutorial_id} t={t} />
									))}
								</ul>
							</section>
						</>
					) : null}
				</div>
			</div>
		</Drawer>
	);
}
