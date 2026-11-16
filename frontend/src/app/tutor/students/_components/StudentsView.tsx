"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import DashboardError from "@/components/dashboard/DashboardError";
import SearchField from "@/components/form/SearchField";
import Table from "@/components/table/Table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useServerSort } from "@/hooks/useServerSort";
import PageTemplate from "@/layouts/template/PageTemplate";
import clsxm from "@/lib/clsxm";
import { formatRelativeTime, getInitials } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { StudentRow } from "@/types/tutor-student";
import { useStudents } from "../_hooks/useStudents";
import StudentDrawer from "./StudentDrawer";

const PAGE_SIZE = 10;

const SORT_COLUMNS = {
	name: "name",
	email: "email",
	school: "school",
	last_login: "last_login_at",
	tutorials: "tutorial_count",
};

export default function StudentsView() {
	const [page, setPage] = React.useState(1);
	const [searchInput, setSearchInput] = React.useState("");
	const [selected, setSelected] = React.useState<string | null>(null);
	const search = useDebouncedValue(searchInput.trim(), 300);

	const { sorting, handleSortingChange, sort, order } = useServerSort(
		SORT_COLUMNS,
		() => setPage(1),
	);
	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		useStudents({ page, pageSize: PAGE_SIZE, search, sort, order });

	const changeSearch = (value: string) => {
		setSearchInput(value);
		setPage(1);
	};

	const columns = React.useMemo<ColumnDef<StudentRow, unknown>[]>(
		() => [
			{
				id: "name",
				accessorFn: (s) => s.name,
				header: "Student",
				meta: { align: "left" },
				cell: ({ row }) => (
					<button
						type="button"
						onClick={() => setSelected(row.original.id)}
						className="flex items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						<span
							aria-hidden
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
						>
							{getInitials(row.original.name)}
						</span>
						<span className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-gray-900 hover:text-brand-700 hover:underline">
								{row.original.name}
							</span>
							<span className="truncate text-xs text-gray-500">
								@{row.original.username}
							</span>
						</span>
					</button>
				),
			},
			{
				id: "email",
				accessorFn: (s) => s.email,
				header: "Email",
				meta: { align: "left" },
				cell: ({ row }) => row.original.email,
			},
			{
				id: "school",
				accessorFn: (s) => s.school,
				header: "School",
				meta: { align: "left" },
				cell: ({ row }) => row.original.school || "–",
			},
			{
				id: "last_login",
				accessorFn: (s) => s.last_login_at,
				header: "Last login",
				meta: { align: "left" },
				cell: ({ row }) =>
					row.original.last_login_at
						? formatRelativeTime(row.original.last_login_at)
						: "Never",
			},
			{
				id: "tutorials",
				accessorFn: (s) => s.tutorial_count,
				header: "Tutorials",
				cell: ({ row }) => (
					<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
						{row.original.tutorial_count}
					</span>
				),
			},
		],
		[],
	);

	return (
		<PageTemplate
			title="Students"
			description="Everyone accepted into any of your tutorials."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{ name: "Students", redirect: PATH.STUDENTS, isClickable: false },
			]}
		>
			<div className="flex justify-end">
				<SearchField
					value={searchInput}
					onChange={changeSearch}
					placeholder="Name, username, email or school"
					aria-label={"Search students"}
					className="w-full sm:w-85"
				/>
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
							{search
								? "No student matches that search."
								: "No students yet. They appear here once you accept their request."}
						</p>
					)}
				</div>
			)}

			<StudentDrawer studentId={selected} onClose={() => setSelected(null)} />
		</PageTemplate>
	);
}
