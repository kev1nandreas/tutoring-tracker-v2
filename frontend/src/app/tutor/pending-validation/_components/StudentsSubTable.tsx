"use client";

import Checkbox from "@mui/material/Checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import Button from "@/components/button/Button";
import Table from "@/components/table/Table";
import { getInitials } from "@/lib/helper";
import type { TutorialStudent, ValidateAction } from "@/types/student";

type Props = {
	students: TutorialStudent[];
	/** Pending requests can be selected and acted on; accepted/declined are read-only. */
	canAct: boolean;
	selectedIds: string[];
	busyUserIds: string[];
	onToggle: (userId: string) => void;
	onToggleAll: () => void;
	onAct: (userId: string, action: ValidateAction) => void;
	/** Opens the student's detail panel. */
	onOpen: (userId: string) => void;
};

const requestedOn = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(iso));

type Ctx = Pick<
	Props,
	| "students"
	| "selectedIds"
	| "busyUserIds"
	| "onToggle"
	| "onToggleAll"
	| "onAct"
	| "onOpen"
>;

// Cells read live state from context, so the column definitions stay stable.
// Rebuilding them on every selection change would remount the checkboxes
// and drop keyboard focus.
const SubTableContext = React.createContext<Ctx>({
	students: [],
	selectedIds: [],
	busyUserIds: [],
	onToggle: () => {},
	onToggleAll: () => {},
	onAct: () => {},
	onOpen: () => {},
});

function SelectAllCheckbox() {
	const { students, selectedIds, onToggleAll } =
		React.useContext(SubTableContext);
	const allSelected =
		students.length > 0 &&
		students.every((s) => selectedIds.includes(s.user_id));

	return (
		<Checkbox
			size="small"
			checked={allSelected}
			indeterminate={selectedIds.length > 0 && !allSelected}
			onChange={onToggleAll}
			slotProps={{
				input: { "aria-label": "Select all students in this tutorial" },
			}}
		/>
	);
}

function RowCheckbox({ student }: { student: TutorialStudent }) {
	const { selectedIds, onToggle } = React.useContext(SubTableContext);

	return (
		<Checkbox
			size="small"
			checked={selectedIds.includes(student.user_id)}
			onChange={() => onToggle(student.user_id)}
			slotProps={{ input: { "aria-label": `Select ${student.name}` } }}
		/>
	);
}

function NameCell({ student }: { student: TutorialStudent }) {
	const { onOpen } = React.useContext(SubTableContext);
	return (
		<button
			type="button"
			onClick={() => onOpen(student.user_id)}
			aria-label={`Open details of ${student.name}`}
			className="flex items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-brand-600"
		>
			<span
				aria-hidden
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
			>
				{getInitials(student.name)}
			</span>
			<span className="font-medium text-gray-900 hover:text-brand-700 hover:underline">
				{student.name}
			</span>
		</button>
	);
}

function RowActions({ student }: { student: TutorialStudent }) {
	const { busyUserIds, onAct } = React.useContext(SubTableContext);
	const busy = busyUserIds.includes(student.user_id);

	return (
		<span className="flex justify-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={busy}
				onClick={() => onAct(student.user_id, "decline")}
			>
				Reject
			</Button>
			<Button
				variant="brand"
				size="sm"
				disabled={busy}
				onClick={() => onAct(student.user_id, "accept")}
			>
				Accept
			</Button>
		</span>
	);
}

/** Sub-table of one tutorial's students, with checkboxes and per-student Accept / Reject. */
export default function StudentsSubTable({
	canAct,
	students,
	selectedIds,
	busyUserIds,
	onToggle,
	onToggleAll,
	onAct,
	onOpen,
}: Props) {
	const columns = React.useMemo<ColumnDef<TutorialStudent, unknown>[]>(() => {
		const cols: ColumnDef<TutorialStudent, unknown>[] = [];

		if (canAct) {
			cols.push({
				id: "select",
				header: () => <SelectAllCheckbox />,
				cell: ({ row }) => <RowCheckbox student={row.original} />,
				enableSorting: false,
			});
		}

		cols.push(
			{
				accessorKey: "name",
				header: "Student",
				meta: { align: "left" },
				cell: ({ row }) => <NameCell student={row.original} />,
			},
			{
				accessorKey: "username",
				header: "Username",
				cell: ({ getValue }) => `@${getValue()}`,
			},
			{
				accessorKey: "school",
				header: "School",
				cell: ({ getValue }) => (getValue() as string) || "–",
			},
			{
				accessorKey: "created_at",
				header: "Requested",
				cell: ({ getValue }) => requestedOn(getValue() as string),
			},
		);

		if (canAct) {
			cols.push({
				id: "actions",
				header: "Actions",
				enableSorting: false,
				cell: ({ row }) => <RowActions student={row.original} />,
			});
		}

		return cols;
	}, [canAct]);

	const value = React.useMemo(
		() => ({
			students,
			selectedIds,
			busyUserIds,
			onToggle,
			onToggleAll,
			onAct,
			onOpen,
		}),
		[students, selectedIds, busyUserIds, onToggle, onToggleAll, onAct, onOpen],
	);

	return (
		<SubTableContext.Provider value={value}>
			<Table
				data={students}
				columns={columns}
				omitSort
				tableClassName="shadow-none ring-gray-100"
			/>
		</SubTableContext.Provider>
	);
}
