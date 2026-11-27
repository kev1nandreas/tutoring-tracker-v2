"use client";

import Drawer from "@mui/material/Drawer";
import {
	BadgeCheck,
	CalendarPlus,
	Clock,
	GraduationCap,
	KeyRound,
	Mail,
	Phone,
	School,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/button/Button";
import clsxm from "@/lib/clsxm";
import { formatRelativeTime, formatShortDate, getInitials } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { AdminUserDetail, AdminUserTutorial } from "@/types/admin-user";
import type { Role } from "@/types/user";
import { useUserDetail } from "../_hooks/useUsers";

type Props = {
	/** Id of the user to show; null keeps the drawer closed. */
	userId: string | null;
	/** The signed-in admin: they cannot delete themselves. */
	meId: string;
	onClose: () => void;
	onDelete: (user: AdminUserDetail) => void;
};

export const ROLE_STYLE: Record<Role, string> = {
	admin: "bg-purple-50 text-purple-700",
	tutor: "bg-brand-50 text-brand-700",
	student: "bg-gray-100 text-gray-700",
};

const STATUS: Record<
	Exclude<AdminUserTutorial["status"], "">,
	{ label: string; cls: string }
> = {
	accepted: { label: "Enrolled", cls: "bg-green-50 text-green-700" },
	pending: { label: "Waiting", cls: "bg-amber-50 text-amber-700" },
	declined: { label: "Rejected", cls: "bg-red-50 text-red-700" },
};

function TutorialItem({ t }: { t: AdminUserTutorial }) {
	const s = t.status ? STATUS[t.status] : null;
	return (
		<li className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-4">
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
					{t.tutor_name ? ` · ${t.tutor_name}` : ""}
				</p>
			</div>
			{s ? (
				<span
					className={clsxm(
						"shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
						s.cls,
					)}
				>
					{s.label}
				</span>
			) : (
				<span className="shrink-0 text-xs text-gray-500">
					{t.student_count} {t.student_count === 1 ? "student" : "students"}
				</span>
			)}
		</li>
	);
}

/** Side panel with one user's account, contact details and tutorials. */
export default function UserDrawer({ userId, meId, onClose, onDelete }: Props) {
	const q = useUserDetail(userId);
	const u = q.data;
	const ownsTutorials = u?.role === "tutor" || u?.role === "admin";
	const owned = u?.tutorials.filter((t) => !t.status) ?? [];
	const joined = u?.tutorials.filter((t) => t.status) ?? [];

	return (
		<Drawer
			anchor="right"
			open={userId !== null}
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
							{u ? getInitials(u.name) : ""}
						</span>
						<div className="min-w-0">
							<h2 className="truncate text-xl font-bold leading-snug text-brand-950">
								{u?.name ?? "User"}
							</h2>
							{u && (
								<p className="flex items-center gap-2 truncate text-sm text-gray-600">
									@{u.username}
									<span
										className={clsxm(
											"rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
											ROLE_STYLE[u.role] ?? ROLE_STYLE.student,
										)}
									>
										{u.role}
									</span>
								</p>
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
					) : u ? (
						<>
							<section className="px-6 py-5">
								<dl className="flex flex-col gap-3 text-sm">
									{[
										{ icon: Mail, label: "Email", v: u.email },
										{ icon: Phone, label: "Phone", v: u.phone },
										{ icon: School, label: "School", v: u.school },
										{
											icon: Clock,
											label: "Last login",
											v: u.last_login_at
												? `Last login ${formatRelativeTime(u.last_login_at)}`
												: "Never logged in",
										},
										{
											icon: CalendarPlus,
											label: "Joined",
											v: `Joined ${formatShortDate(u.created_at)}`,
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
								<div className="mt-4 flex flex-wrap gap-2 text-xs">
									<span
										className={clsxm(
											"flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
											u.email_verified
												? "bg-green-50 text-green-700"
												: "bg-amber-50 text-amber-700",
										)}
									>
										<BadgeCheck size={13} aria-hidden />
										{u.email_verified ? "Email verified" : "Email not verified"}
									</span>
									<span
										className={clsxm(
											"flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
											u.has_password
												? "bg-gray-100 text-gray-700"
												: "bg-amber-50 text-amber-700",
										)}
									>
										<KeyRound size={13} aria-hidden />
										{u.has_password ? "Has a password" : "Google sign-in only"}
									</span>
								</div>
							</section>

							{(ownsTutorials || owned.length > 0) && (
								<section className="border-t border-gray-100 px-6 py-5">
									<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
										<GraduationCap
											size={16}
											className="text-brand-700"
											aria-hidden
										/>
										Tutorials they run ({owned.length})
									</h3>
									{owned.length === 0 ? (
										<p className="text-sm text-gray-400">None yet.</p>
									) : (
										<ul className="flex flex-col gap-3">
											{owned.map((t) => (
												<TutorialItem key={t.tutorial_id} t={t} />
											))}
										</ul>
									)}
								</section>
							)}

							{(!ownsTutorials || joined.length > 0) && (
								<section className="border-t border-gray-100 px-6 py-5">
									<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
										<GraduationCap
											size={16}
											className="text-brand-700"
											aria-hidden
										/>
										Tutorials they joined ({joined.length})
									</h3>
									{joined.length === 0 ? (
										<p className="text-sm text-gray-400">None yet.</p>
									) : (
										<ul className="flex flex-col gap-3">
											{joined.map((t) => (
												<TutorialItem key={t.tutorial_id} t={t} />
											))}
										</ul>
									)}
								</section>
							)}
						</>
					) : null}
				</div>

				{u && u.id !== meId && (
					<footer className="border-t border-gray-100 px-6 py-4">
						<Button
							variant="outline"
							leftIcon={Trash2}
							className="w-full border-red-200 text-red-700 hover:bg-red-50"
							onClick={() => onDelete(u)}
						>
							Delete user
						</Button>
					</footer>
				)}
			</div>
		</Drawer>
	);
}
