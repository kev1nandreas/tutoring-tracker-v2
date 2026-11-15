"use client";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type ExpandedState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type Row,
	type RowData,
	type SortingState,
	type Updater,
	useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import Filter from "@/components/table/Filter";
import PaginationControl from "@/components/table/PaginationControl";
import TBody from "@/components/table/TBody";
import THead from "@/components/table/THead";
import clsxm from "@/lib/clsxm";

export type ColumnMetaType = {
	apiField?: string;
	/** Cell/header text alignment. Defaults to centered. */
	align?: "left" | "center";
};

// Extend the ColumnMeta interface from @tanstack/react-table
declare module "@tanstack/react-table" {
	// biome-ignore lint/correctness/noUnusedVariables: All declarations of 'ColumnMeta' must have identical type parameters.
	interface ColumnMeta<TData extends RowData, TValue> extends ColumnMetaType {}
}

type PaginationState = {
	page: number;
	size: number;
};

type TableProps<T extends object> = {
	data: T[];
	columns: ColumnDef<T, unknown>[];
	initialPageSize?: number;
	footers?: React.ReactNode;
	extras?: React.ReactNode;
	leftExtras?: React.ReactNode;
	isLoading?: boolean;
	omitSort?: boolean;
	withFilter?: boolean;
	filterPlaceholder?: string;
	withEntries?: boolean;
	withPaginationControl?: boolean;
	withLink?: boolean;
	/** Renders extra content under a row while it is expanded. */
	renderSubComponent?: (row: Row<T>) => React.ReactNode;
	/** With `renderSubComponent`: start with every row expanded. */
	defaultExpanded?: boolean;
	tableClassName?: string;
	manualPagination?: boolean;
	pagination?: PaginationState;
	onPaginationChange?: (pagination: PaginationState) => void;
	pageCount?: number;
	manualSorting?: boolean;
	sorting?: SortingState;
	onSortingChange?: (sorting: SortingState) => void;
	manualFiltering?: boolean;
	globalFilter?: string;
	onGlobalFilterChange?: (globalFilter: string) => void;
} & React.ComponentPropsWithoutRef<"div">;

const DEFAULT_PAGE_SIZE = 10;

export default function Table<T extends object>({
	className,
	columns,
	data,
	initialPageSize = DEFAULT_PAGE_SIZE,
	footers,
	extras,
	leftExtras,
	isLoading,
	omitSort = false,
	withFilter = false,
	filterPlaceholder,
	withEntries = false,
	withPaginationControl = false,
	withLink = false,
	renderSubComponent,
	defaultExpanded = false,
	tableClassName,
	manualPagination = false,
	pagination: controlledPagination,
	onPaginationChange,
	pageCount,
	manualSorting = false,
	sorting: controlledSorting,
	onSortingChange,
	manualFiltering = false,
	globalFilter: controlledGlobalFilter,
	onGlobalFilterChange,
	...rest
}: TableProps<T>) {
	const [internalSorting, setInternalSorting] = React.useState<SortingState>(
		[],
	);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [expanded, setExpanded] = React.useState<ExpandedState>(
		defaultExpanded ? true : {},
	);
	const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
	const [internalPagination, setInternalPagination] =
		React.useState<PaginationState>({
			page: 1,
			size: initialPageSize,
		});

	const sorting = manualSorting ? (controlledSorting ?? []) : internalSorting;
	const globalFilter = manualFiltering
		? (controlledGlobalFilter ?? "")
		: internalGlobalFilter;
	const pagination = manualPagination
		? (controlledPagination ?? { page: 1, size: initialPageSize })
		: internalPagination;

	const setPagination = React.useCallback(
		(updater: Updater<PaginationState>) => {
			const next =
				typeof updater === "function" ? updater(pagination) : updater;

			if (manualPagination) {
				onPaginationChange?.(next);
			} else {
				setInternalPagination(next);
			}
		},
		[manualPagination, onPaginationChange, pagination],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			expanded,
			pagination: {
				pageIndex: pagination.page - 1,
				pageSize: pagination.size,
			},
		},
		manualSorting,
		manualFiltering,
		manualPagination,
		getRowCanExpand: () => !!renderSubComponent,
		onExpandedChange: setExpanded,
		pageCount: manualPagination ? (pageCount ?? -1) : undefined,
		onSortingChange: (updater) => {
			const next = typeof updater === "function" ? updater(sorting) : updater;

			if (manualSorting) {
				onSortingChange?.(next);
			} else {
				setInternalSorting(next);
			}
		},
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: (updater) => {
			const next =
				typeof updater === "function" ? updater(globalFilter) : updater;

			if (manualFiltering) {
				onGlobalFilterChange?.(next);
			} else {
				setInternalGlobalFilter(next);
			}
		},
		onPaginationChange: (updater) => {
			setPagination((previous) => {
				const oldState = {
					pageIndex: previous.page - 1,
					pageSize: previous.size,
				};
				const nextState =
					typeof updater === "function" ? updater(oldState) : updater;

				return {
					page: nextState.pageIndex + 1,
					size: nextState.pageSize,
				};
			});
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
		getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
		getPaginationRowModel: manualPagination
			? undefined
			: getPaginationRowModel(),
	});

	React.useEffect(() => {
		if (manualPagination) return;

		setInternalPagination((prev) => {
			if (prev.size === initialPageSize) {
				return prev;
			}

			return {
				page: 1,
				size: initialPageSize,
			};
		});
	}, [initialPageSize, manualPagination]);

	const handlePageSizeChange = React.useCallback(
		(value: string | number) => {
			const parsedValue = Number(value) || DEFAULT_PAGE_SIZE;
			setPagination((prev) => {
				if (prev.size === parsedValue && prev.page === 1) {
					return prev;
				}

				return {
					page: 1,
					size: parsedValue,
				};
			});
		},
		[setPagination],
	);

	return (
		<div className={clsxm("flex w-full min-w-0 flex-col", className)} {...rest}>
			<div className="mb-2 flex flex-wrap items-end justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-2">
					{withFilter && (
						<Filter
							table={table}
							placeholder={filterPlaceholder}
							className="min-w-0 flex-1 sm:max-w-xs"
						/>
					)}
					{leftExtras && <>{leftExtras}</>}
				</div>

				<div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-4">
					{extras && <>{extras}</>}
				</div>
			</div>
			<div
				className={clsxm(
					"relative mt-2 w-full max-w-full overflow-auto custom-scrollbar rounded-lg shadow-sm ring-1 ring-gray-200",
					tableClassName,
				)}
			>
				<table className="w-full min-w-max">
					<THead
						table={table}
						omitSort={omitSort}
						className="sticky top-0 z-10"
					/>
					<TBody
						table={table}
						isLoading={isLoading}
						withLink={withLink}
						renderSubComponent={renderSubComponent}
					/>
					{footers && (
						<tfoot className="bg-gray-100 sticky bottom-0 z-10">
							<tr>
								<td
									colSpan={columns.length}
									className="text-sm text-gray-700 pt-2 pl-2"
								>
									{footers}
								</td>
							</tr>
						</tfoot>
					)}
				</table>
			</div>
			{(withPaginationControl || withEntries) && (
				<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
					<div>
						{withEntries && (
							<Select
								value={pagination.size}
								onChange={(event) =>
									handlePageSizeChange(event.target.value as number)
								}
								size="small"
								sx={{ minWidth: 80, height: 35, fontSize: "0.875rem" }}
							>
								{[10, 25, 50, 100].map((size) => (
									<MenuItem
										key={size}
										value={size}
										sx={{ fontSize: "0.875rem" }}
									>
										{size} rows
									</MenuItem>
								))}
							</Select>
						)}
					</div>
					{withPaginationControl && (
						<PaginationControl
							table={table}
							data={data}
							setParams={setPagination}
							apiIntegration={
								manualPagination
									? {
											enabled: true,
											currentPage: pagination.page,
											totalPages: pageCount ?? 1,
										}
									: { enabled: false }
							}
						/>
					)}
				</div>
			)}
		</div>
	);
}
