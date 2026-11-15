import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import type { RowData, Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import clsxm from "@/lib/clsxm";

type PaginationState = {
	page: number;
	size: number;
};

type ApiIntegrationProps = {
	enabled: boolean;
	currentPage?: number;
	pageSize?: number;
	orderBy?: string;
	isAsc?: boolean;
	totalPages?: number; // Add this field for API total pages
};

type PaginationControlProps<T extends RowData> = {
	data: T[];
	table: Table<T>;
	setParams: React.Dispatch<React.SetStateAction<PaginationState>>;
	apiIntegration?: ApiIntegrationProps;
	onPageChange?: (page: number) => void;
} & React.ComponentPropsWithoutRef<"div">;

export default function PaginationControl<T extends RowData>({
	className,
	data,
	table,
	setParams,
	apiIntegration = { enabled: false },
	onPageChange,
	...rest
}: PaginationControlProps<T>) {
	// Get current page with fallback
	const currentPage =
		apiIntegration.enabled && apiIntegration.currentPage
			? apiIntegration.currentPage
			: (table?.getState()?.pagination?.pageIndex ?? 0) + 1;

	// Get page count based on API metadata or table data
	let pageCount = 1; // Default to 1

	if (apiIntegration.enabled && apiIntegration.totalPages !== undefined) {
		// Use API's total pages when available
		pageCount = apiIntegration.totalPages;
	} else {
		// For client-side pagination, use the table's page count
		pageCount = table?.getPageCount?.() || 1;
	}

	const handleChange = (_event: React.ChangeEvent<unknown>, page: number) => {
		setParams((params) => ({
			...params,
			page,
		}));

		if (apiIntegration.enabled && onPageChange) {
			onPageChange(page);
		} else if (table?.setPageIndex) {
			table.setPageIndex(page - 1);
		}
	};

	return (
		<div
			className={clsxm(
				"flex items-center justify-between gap-x-2 md:justify-end",
				className,
			)}
			{...rest}
		>
			<Pagination
				page={currentPage}
				count={pageCount}
				onChange={handleChange}
				shape="rounded"
				variant="outlined"
				color="primary"
				renderItem={(item) => (
					<PaginationItem
						slots={{ previous: ChevronLeft, next: ChevronRight }}
						{...item}
					/>
				)}
				sx={{
					"& .MuiPaginationItem-root": { fontWeight: 600 },
					"& .MuiPaginationItem-outlined.Mui-selected": { color: "primary" },
				}}
			/>
		</div>
	);
}
