"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Bell, BookOpen, CheckCheck, Download, UserCheck } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DashboardError from "@/components/dashboard/DashboardError";
import { useMarkRead, useNotifications } from "@/hooks/useNotifications";
import clsxm from "@/lib/clsxm";
import { formatRelativeTime } from "@/lib/helper";
import type { NotificationFilter } from "@/services/api/main/notification";
import type { Notification } from "@/types/notification";

const PAGE_SIZE = 10;

const TYPE_ICON: Record<string, typeof Bell> = {
	material: BookOpen,
	download: Download,
	enrollment: UserCheck,
};

function Row({
	item,
	onRead,
	busy,
}: {
	item: Notification;
	onRead: (id: string) => void;
	busy: boolean;
}) {
	const Icon = TYPE_ICON[item.type] ?? Bell;
	return (
		<li
			className={clsxm(
				"flex items-start gap-3 py-4 first:pt-0 last:pb-0",
				!item.is_read && "bg-brand-50/40",
			)}
		>
			<span
				aria-hidden
				className={clsxm(
					"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
					item.is_read
						? "bg-gray-100 text-gray-500"
						: "bg-brand-100 text-brand-700",
				)}
			>
				<Icon size={16} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
					{item.header}
					{!item.is_read && (
						<span
							role="img"
							aria-label="Unread"
							className="h-2 w-2 rounded-full bg-brand-600"
						/>
					)}
				</p>
				<p className="mt-0.5 text-sm text-gray-600">{item.body}</p>
				<p className="mt-1 text-xs text-gray-400">
					{formatRelativeTime(item.created_at)}
				</p>
			</div>
			{!item.is_read && (
				<Button
					variant="outline"
					size="sm"
					leftIcon={CheckCheck}
					disabled={busy}
					onClick={() => onRead(item.id)}
				>
					Mark read
				</Button>
			)}
		</li>
	);
}

/** The signed-in user's notifications, newest first. Shared by the student and tutor pages. */
export default function NotificationsView() {
	const [filter, setFilter] = React.useState<NotificationFilter>("all");
	const [page, setPage] = React.useState(1);
	const { data, isLoading, isError, error, refetch } = useNotifications({
		page,
		pageSize: PAGE_SIZE,
		filter,
	});
	const markRead = useMarkRead();

	const items = data?.items ?? [];
	const totalPages = data?.meta?.total_pages ?? 1;

	if (isError) {
		return <DashboardError message={error.message} onRetry={() => refetch()} />;
	}

	return (
		<DashboardCard
			title="Notifications"
			description="New material, finished download packages and other updates. A copy is also sent to your email."
			count={data?.meta?.total_items}
			isLoading={isLoading}
		>
			<Tabs
				value={filter}
				onChange={(_, next: NotificationFilter) => {
					setFilter(next);
					setPage(1);
				}}
				aria-label="Filter notifications"
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
				<Tab value="all" label="All" />
				<Tab value="unread" label="Unread" />
			</Tabs>

			{items.length === 0 ? (
				<p className="py-8 text-center text-sm text-gray-400">
					{filter === "unread"
						? "You are all caught up."
						: "No notifications yet."}
				</p>
			) : (
				<ul className="divide-y divide-gray-100">
					{items.map((item) => (
						<Row
							key={item.id}
							item={item}
							busy={markRead.isPending}
							onRead={(id) => markRead.mutate(id)}
						/>
					))}
				</ul>
			)}

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						Previous
					</Button>
					<span className="text-xs text-gray-500">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						Next
					</Button>
				</div>
			)}
		</DashboardCard>
	);
}
