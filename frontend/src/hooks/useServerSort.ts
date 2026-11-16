import type { SortingState } from "@tanstack/react-table";
import * as React from "react";

/**
 * Sorting state for a server-sorted table. Column ids are mapped to API
 * column names; `onChange` also lets the caller go back to page 1.
 */
export function useServerSort(
	apiColumns: Record<string, string>,
	onChange?: () => void,
) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const handleSortingChange = React.useCallback(
		(next: SortingState) => {
			setSorting(next.slice(0, 1));
			onChange?.();
		},
		[onChange],
	);

	const active = sorting[0];
	const sort = active ? apiColumns[active.id] : undefined;
	const order = active ? (active.desc ? "desc" : "asc") : undefined;

	return { sorting, handleSortingChange, sort, order } as const;
}
