"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { CalendarDays, Check, Clock, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { formatShortDate } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { EnrollmentStatus, MyEnrollment } from "@/types/enroll";
import { useMyEnrollments } from "../_hooks/useMyEnrollments";

type Filter = "all" | EnrollmentStatus;

const STATUS = {
	pending: {
		label: "Waiting for tutor",
		badge: "bg-amber-50 text-amber-700",
		accent: "bg-amber-400",
		icon: Clock,
		verb: "Requested",
	},
	accepted: {
		label: "Accepted",
		badge: "bg-green-50 text-green-700",
		accent: "bg-green-500",
		icon: Check,
		verb: "Accepted",
	},
	declined: {
		label: "Declined",
		badge: "bg-red-50 text-red-700",
		accent: "bg-red-400",
		icon: X,
		verb: "Declined",
	},
} as const;

const EMPTY: Record<Filter, string> = {
	all: "You have not asked to join a class yet. Enter a class code above to start.",
	pending: "No requests are waiting.",
	accepted: "You have not been accepted into a class yet.",
	declined: "No declined requests.",
};

type Props = { onAskAgain: (code: string) => void };

function HistoryRow({
	item,
	onAskAgain,
}: {
	item: MyEnrollment;
	onAskAgain: (code: string) => void;
}) {
	const s = STATUS[item.status];
	const Icon = s.icon;

	return (
		<li className="relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 pl-4 first:pt-0 last:pb-0">
			<span
				aria-hidden
				className={`absolute top-4 bottom-4 left-0 w-1 rounded-full first:top-0 last:bottom-0 ${s.accent}`}
			/>

			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="min-w-0 break-words text-sm font-semibold text-gray-900">
						{item.tutorial.name}
					</p>
					<span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-800">
						{item.tutorial.custom_id}
					</span>
				</div>
				<p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
					<span>
						{s.verb} {formatShortDate(item.updated_at)}
					</span>
					<span className="flex items-center gap-1">
						<CalendarDays size={12} aria-hidden />
						{formatShortDate(item.tutorial.date_started)} –{" "}
						{formatShortDate(item.tutorial.date_ended)}
					</span>
					{item.tutorial.is_done && (
						<span className="font-medium text-gray-600">Class finished</span>
					)}
				</p>
			</div>

			<div className="flex shrink-0 flex-wrap items-center gap-3">
				<span
					className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}
				>
					<Icon size={12} aria-hidden />
					{s.label}
				</span>
				{item.status === "accepted" && (
					<Link
						href={PATH.STUDENT_HOME}
						className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						Go to home
					</Link>
				)}
				{item.status === "declined" && !item.tutorial.is_done && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onAskAgain(item.tutorial.custom_id)}
					>
						Ask again
					</Button>
				)}
			</div>
		</li>
	);
}

/** The student's enrollment requests and where each one stands. */
export default function EnrollmentHistory({ onAskAgain }: Props) {
	const [filter, setFilter] = React.useState<Filter>("all");
	const { data, isLoading, isError, error, refetch } = useMyEnrollments();

	const items = data ?? [];
	const count = (s: EnrollmentStatus) =>
		items.filter((i) => i.status === s).length;
	const visible =
		filter === "all" ? items : items.filter((i) => i.status === filter);

	return (
		<DashboardCard
			title="My requests"
			description="Every class you asked to join, and its status."
			count={items.length}
			isLoading={isLoading}
		>
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
				<>
					<Tabs
						value={filter}
						onChange={(_, next: Filter) => setFilter(next)}
						variant="scrollable"
						scrollButtons={false}
						aria-label="Filter requests by status"
						sx={{
							minHeight: 40,
							mt: -1,
							mb: 1,
							borderBottom: 1,
							borderColor: "divider",
							"& .MuiTab-root": {
								textTransform: "none",
								fontWeight: 500,
								fontSize: 14,
								minHeight: 40,
								minWidth: 72,
							},
						}}
					>
						<Tab value="all" label={`All (${items.length})`} />
						<Tab value="pending" label={`Waiting (${count("pending")})`} />
						<Tab value="accepted" label={`Accepted (${count("accepted")})`} />
						<Tab value="declined" label={`Declined (${count("declined")})`} />
					</Tabs>

					{visible.length === 0 ? (
						<p className="py-8 text-center text-sm text-gray-400">
							{EMPTY[filter]}
						</p>
					) : (
						<ul className="divide-y divide-gray-100">
							{visible.map((item) => (
								<HistoryRow key={item.id} item={item} onAskAgain={onAskAgain} />
							))}
						</ul>
					)}
				</>
			)}
		</DashboardCard>
	);
}
