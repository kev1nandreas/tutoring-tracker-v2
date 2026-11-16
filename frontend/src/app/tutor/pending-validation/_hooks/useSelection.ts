import * as React from "react";

/** Selected student ids, grouped by tutorial code. */
export type Selection = Record<string, string[]>;

export function useSelection() {
	const [selection, setSelection] = React.useState<Selection>({});

	const toggle = React.useCallback((code: string, userId: string) => {
		setSelection((prev) => {
			const current = prev[code] ?? [];
			const next = current.includes(userId)
				? current.filter((id) => id !== userId)
				: [...current, userId];
			return { ...prev, [code]: next };
		});
	}, []);

	/** Select all of `userIds` for a tutorial, or clear them when they are all selected already. */
	const toggleAll = React.useCallback((code: string, userIds: string[]) => {
		setSelection((prev) => {
			const current = prev[code] ?? [];
			const allSelected =
				userIds.length > 0 && userIds.every((id) => current.includes(id));
			return { ...prev, [code]: allSelected ? [] : userIds };
		});
	}, []);

	const clear = React.useCallback(() => setSelection({}), []);

	const total = Object.values(selection).reduce((n, ids) => n + ids.length, 0);
	const batch = Object.entries(selection)
		.filter(([, ids]) => ids.length > 0)
		.map(([tutorialCode, userIds]) => ({ tutorialCode, userIds }));

	return { selection, toggle, toggleAll, clear, total, batch };
}
