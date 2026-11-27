"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2, UserPlus } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardError from "@/components/dashboard/DashboardError";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import SearchField from "@/components/form/SearchField";
import withAuth, { type WithAuthProps } from "@/components/hoc/withAuth";
import Table from "@/components/table/Table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useServerSort } from "@/hooks/useServerSort";
import PageTemplate from "@/layouts/template/PageTemplate";
import clsxm from "@/lib/clsxm";
import { formatRelativeTime, getInitials } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { AdminUserRow } from "@/types/admin-user";
import type { Role } from "@/types/user";
import { useDeleteUserMutation, useUsers } from "../_hooks/useUsers";
import AddTutorDialog from "./AddTutorDialog";

const PAGE_SIZE = 10;

const SORT_COLUMNS = {
	name: "name",
	email: "email",
	role: "role",
	last_login: "last_login_at",
	tutorials: "tutorial_count",
	joined: "created_at",
};

type RoleTab = "all" | Role;

const ROLE_STYLE: Record<Role, string> = {
	admin: "bg-purple-50 text-purple-700",
	tutor: "bg-brand-50 text-brand-700",
	student: "bg-gray-100 text-gray-700",
};

/** What deleting this user takes with them, in plain words. */
function deleteMessage(u: AdminUserRow) {
	if (u.role === "tutor")
		return `Delete ${u.name}? Their ${u.tutorial_count} ${u.tutorial_count === 1 ? "tutorial" : "tutorials"} go with them: every meeting, file, enrollment, homework, attendance record, feedback and payment in them. This cannot be undone.`;
	if (u.role === "student")
		return `Delete ${u.name}? Their enrollments, homework, attendance photos and notifications are removed. Payments they made stay in the tutor's records without their name. This cannot be undone.`;
	return `Delete ${u.name}? This admin account and its notifications are removed. This cannot be undone.`;
}

function UsersView({ user: me }: WithAuthProps) {
	const [page, setPage] = React.useState(1);
	const [tab, setTab] = React.useState<RoleTab>("all");
	const [searchInput, setSearchInput] = React.useState("");
	const [isAddOpen, setIsAddOpen] = React.useState(false);
	const [deleting, setDeleting] = React.useState<AdminUserRow | null>(null);
	const search = useDebouncedValue(searchInput.trim(), 300);

	const { sorting, handleSortingChange, sort, order } = useServerSort(
		SORT_COLUMNS,
		() => setPage(1),
	);
	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		useUsers({
			page,
			pageSize: PAGE_SIZE,
			search,
			role: tab === "all" ? undefined : tab,
			sort,
			order,
		});
	const remove = useDeleteUserMutation();

	const changeSearch = (value: string) => {
		setSearchInput(value);
		setPage(1);
	};

	const columns = React.useMemo<ColumnDef<AdminUserRow, unknown>[]>(
		() => [
			{
				id: "name",
				accessorFn: (u) => u.name,
				header: "User",
				meta: { align: "left" },
				cell: ({ row }) => (
					<span className="flex items-center gap-3">
						<span
							aria-hidden
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
						>
							{getInitials(row.original.name)}
						</span>
						<span className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-gray-900">
								{row.original.name}
								{row.original.id === me.id && (
									<span className="ml-1.5 text-xs font-normal text-gray-400">
										(you)
									</span>
								)}
							</span>
							<span className="truncate text-xs text-gray-500">
								@{row.original.username}
							</span>
						</span>
					</span>
				),
			},
			{
				id: "email",
				accessorFn: (u) => u.email,
				header: "Email",
				meta: { align: "left" },
				cell: ({ row }) => row.original.email,
			},
			{
				id: "role",
				accessorFn: (u) => u.role,
				header: "Role",
				meta: { align: "left" },
				cell: ({ row }) => (
					<span
						className={clsxm(
							"rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
							ROLE_STYLE[row.original.role] ?? ROLE_STYLE.student,
						)}
					>
						{row.original.role}
					</span>
				),
			},
			{
				id: "last_login",
				accessorFn: (u) => u.last_login_at,
				header: "Last login",
				meta: { align: "left" },
				cell: ({ row }) =>
					row.original.last_login_at
						? formatRelativeTime(row.original.last_login_at)
						: "Never",
			},
			{
				id: "tutorials",
				accessorFn: (u) => u.tutorial_count,
				header: "Tutorials",
				cell: ({ row }) => (
					<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
						{row.original.tutorial_count}
					</span>
				),
			},
			{
				id: "actions",
				header: "",
				enableSorting: false,
				cell: ({ row }) =>
					row.original.id === me.id ? null : (
						<Button
							variant="outline"
							size="sm"
							leftIcon={Trash2}
							isLoading={
								remove.isPending && remove.variables === row.original.id
							}
							disabled={remove.isPending}
							onClick={() => setDeleting(row.original)}
						>
							Delete
						</Button>
					),
			},
		],
		[me.id, remove.isPending, remove.variables],
	);

	return (
		<PageTemplate
			title="Users"
			description="Everyone registered, tutors and students alike."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{ name: "Users", redirect: PATH.USERS, isClickable: false },
			]}
		>
			<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
				<Tabs
					variant="scrollable"
					scrollButtons={false}
					value={tab}
					onChange={(_, next: RoleTab) => {
						setTab(next);
						setPage(1);
					}}
					aria-label="Filter users by role"
					sx={{
						minHeight: 40,
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
					<Tab value="tutor" label="Tutors" />
					<Tab value="student" label="Students" />
					<Tab value="admin" label="Admins" />
				</Tabs>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<SearchField
						value={searchInput}
						onChange={changeSearch}
						placeholder="Name, username, email or school"
						aria-label="Search users"
						className="w-full sm:w-85"
					/>
					<Button
						variant="brand"
						leftIcon={UserPlus}
						onClick={() => setIsAddOpen(true)}
					>
						Add tutor
					</Button>
				</div>
			</div>

			{isError ? (
				<DashboardError message={error.message} onRetry={() => refetch()} />
			) : (
				<div
					className={clsxm(
						isPlaceholderData && "opacity-60 transition-opacity",
					)}
				>
					<Table
						data={data?.items ?? []}
						columns={columns}
						isLoading={isLoading}
						manualSorting
						sorting={sorting}
						onSortingChange={handleSortingChange}
						withPaginationControl
						manualPagination
						pagination={{ page, size: PAGE_SIZE }}
						onPaginationChange={(p) => setPage(p.page)}
						pageCount={data?.meta?.total_pages ?? 1}
					/>
					{!isLoading && data?.items.length === 0 && (
						<p className="py-10 text-center text-sm text-gray-400">
							{search ? "No user matches that search." : "No users here."}
						</p>
					)}
				</div>
			)}

			<AddTutorDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
			<ConfirmationDialog
				isOpen={deleting !== null}
				setIsOpen={(open) => !open && setDeleting(null)}
				message={deleting ? deleteMessage(deleting) : ""}
				confirmLabel="Delete"
				cancelLabel="Cancel"
				confirmVariant="red"
				onConfirm={() => deleting && remove.mutate(deleting.id)}
			/>
		</PageTemplate>
	);
}

// the tutor area lets tutors in too; this page is for admins only
export default withAuth(UsersView, { roles: ["admin"] });
