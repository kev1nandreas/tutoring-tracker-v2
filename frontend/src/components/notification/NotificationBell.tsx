"use client";

import Popover from "@mui/material/Popover";
import { Bell } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import {
	useMarkRead,
	useNotifications,
	useUnreadCount,
} from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/helper";
import { notificationsPath } from "@/shared/path";

const PREVIEW_SIZE = 5;

/** Bell with an unread badge. Opens a dropdown of unread notifications and a link to the full page. */
export default function NotificationBell() {
	const role = useAuthStore((s) => s.user?.role);
	const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	const { data: unread = 0 } = useUnreadCount();
	const { data, isLoading, isError } = useNotifications({
		page: 1,
		pageSize: PREVIEW_SIZE,
		filter: "unread",
	});
	const markRead = useMarkRead();
	const items = data?.items ?? [];
	const close = () => setAnchorEl(null);

	return (
		<>
			<button
				type="button"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				aria-haspopup="true"
				aria-expanded={open}
				aria-label={
					unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
				}
				className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<Bell size={20} aria-hidden />
				{unread > 0 && (
					<span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 font-semibold text-white">
						{unread > 99 ? "99+" : unread}
					</span>
				)}
			</button>

			<Popover
				anchorEl={anchorEl}
				open={open}
				onClose={close}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{
					paper: { className: "mt-1 w-[min(22rem,calc(100vw-2rem))]" },
				}}
			>
				<div className="border-b border-gray-100 px-4 py-3">
					<p className="text-sm font-semibold text-gray-900">
						Unread notifications
						{unread > 0 && (
							<span className="ml-2 text-xs font-medium text-gray-500">
								{unread}
							</span>
						)}
					</p>
				</div>

				{isLoading ? (
					<div className="flex flex-col gap-2 p-4" aria-busy="true">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="h-10 animate-pulse rounded-lg bg-gray-100"
							/>
						))}
					</div>
				) : isError ? (
					<p
						role="alert"
						className="px-4 py-6 text-center text-sm text-red-600"
					>
						Could not load notifications.
					</p>
				) : items.length === 0 ? (
					<p className="px-4 py-6 text-center text-sm text-gray-400">
						You are all caught up.
					</p>
				) : (
					<ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
						{items.map((item) => (
							<li key={item.id} className="flex items-start gap-3 px-4 py-3">
								<span
									aria-hidden
									className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-gray-900">
										{item.header}
									</p>
									<p className="line-clamp-2 text-xs text-gray-600">
										{item.body}
									</p>
									<p className="mt-1 text-xs text-gray-400">
										{formatRelativeTime(item.created_at)}
									</p>
								</div>
								<button
									type="button"
									disabled={markRead.isPending}
									onClick={() => markRead.mutate(item.id)}
									className="shrink-0 cursor-pointer text-xs font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50"
								>
									Mark read
								</button>
							</li>
						))}
					</ul>
				)}

				<div className="border-t border-gray-100 p-2">
					<Link
						href={notificationsPath(role)}
						onClick={close}
						className="block rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						See all notifications
					</Link>
				</div>
			</Popover>
		</>
	);
}
