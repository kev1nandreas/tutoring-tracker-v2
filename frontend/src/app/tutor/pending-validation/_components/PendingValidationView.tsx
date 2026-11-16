"use client";

import InputAdornment from "@mui/material/InputAdornment";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Search, X } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardError from "@/components/dashboard/DashboardError";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import Table from "@/components/table/Table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import PageTemplate from "@/layouts/template/PageTemplate";
import clsxm from "@/lib/clsxm";
import { validationQuestion } from "@/lib/enrollmentMessages";
import { PATH } from "@/shared/path";
import type {
	StudentStatus,
	ValidateAction,
	ValidationGroup,
} from "@/types/student";
import StudentDrawer from "../../students/_components/StudentDrawer";
import { useBulkValidate, type ValidateBatch } from "../_hooks/useBulkValidate";
import { useSelection } from "../_hooks/useSelection";
import { useValidationGroups } from "../_hooks/useValidationGroups";
import StudentsSubTable from "./StudentsSubTable";

const PAGE_SIZE = 10;

const TABS: { value: StudentStatus; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "accepted", label: "Accepted" },
	{ value: "declined", label: "Rejected" },
];

type Pending = {
	batch: ValidateBatch;
	action: ValidateAction;
	message: string;
};

// Parent-row buttons read live state from context so the columns stay stable.
const ViewContext = React.createContext<{
	isPending: boolean;
	ask: (action: ValidateAction, b: ValidateBatch) => void;
}>({
	isPending: false,
	ask: () => {},
});

function GroupActions({ group }: { group: ValidationGroup }) {
	const { isPending, ask } = React.useContext(ViewContext);
	const b: ValidateBatch = [
		{
			tutorialCode: group.tutorial.custom_id,
			userIds: group.pending_validations.map((s) => s.user_id),
		},
	];

	return (
		// the row toggles on click, so keep these clicks to themselves
		// biome-ignore lint/a11y/noStaticElementInteractions: stops row toggle only
		<span
			className="flex justify-center gap-2"
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<Button
				variant="outline"
				size="sm"
				disabled={isPending}
				onClick={() => ask("decline", b)}
			>
				Reject all
			</Button>
			<Button
				variant="brand"
				size="sm"
				disabled={isPending}
				onClick={() => ask("accept", b)}
			>
				Accept all
			</Button>
		</span>
	);
}

const plural = (n: number) => `${n} ${n === 1 ? "student" : "students"}`;

export default function PendingValidationView() {
	const [status, setStatus] = React.useState<StudentStatus>("pending");
	const [page, setPage] = React.useState(1);
	const [openId, setOpenId] = React.useState<string | null>(null);
	const [confirm, setConfirm] = React.useState<Pending | null>(null);
	const [searchInput, setSearchInput] = React.useState("");
	const search = useDebouncedValue(searchInput.trim(), 300);
	const canAct = status === "pending";

	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		useValidationGroups({
			status,
			page,
			pageSize: PAGE_SIZE,
			search,
		});
	const groups = data?.groups ?? [];
	const meta = data?.meta;

	const { selection, toggle, toggleAll, clear, total, batch } = useSelection();
	const validate = useBulkValidate({ onDone: clear });
	const busyIds = validate.isPending
		? validate.variables.batch.flatMap((b) => b.userIds)
		: [];

	const changeStatus = (next: StudentStatus) => {
		setStatus(next);
		setPage(1);
		clear();
	};

	// a new search shows a different set of students, so start over
	const changeSearch = (value: string) => {
		setSearchInput(value);
		setPage(1);
		clear();
	};

	const run = (action: ValidateAction, b: ValidateBatch) =>
		validate.mutate({ batch: b, action });

	// `subject` names a single student; without it the message counts the students
	const ask = React.useCallback(
		(action: ValidateAction, b: ValidateBatch, subject?: string) => {
			const n = b.reduce((sum, x) => sum + x.userIds.length, 0);
			setConfirm({
				batch: b,
				action,
				message: validationQuestion(action, subject ?? plural(n)),
			});
		},
		[],
	);

	const columns = React.useMemo<ColumnDef<ValidationGroup, unknown>[]>(() => {
		const cols: ColumnDef<ValidationGroup, unknown>[] = [
			{
				id: "expand",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<ChevronDown
						size={18}
						aria-hidden
						className={clsxm(
							"mx-auto text-gray-400 transition-transform",
							row.getIsExpanded() && "rotate-180",
						)}
					/>
				),
			},
			{
				id: "tutorial",
				header: "Tutorial",
				meta: { align: "left" },
				cell: ({ row }) => (
					<span className="flex flex-col">
						<span className="font-medium text-gray-900">
							{row.original.tutorial.name}
						</span>
						<span className="text-xs text-gray-500">
							{row.original.tutorial.custom_id}
						</span>
					</span>
				),
			},
			{
				id: "count",
				header: "Students",
				cell: ({ row }) => (
					<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
						{row.original.pending_validations.length}
					</span>
				),
			},
		];

		if (canAct) {
			cols.push({
				id: "actions",
				header: "Actions",
				enableSorting: false,
				cell: ({ row }) => <GroupActions group={row.original} />,
			});
		}
		return cols;
	}, [canAct]);

	const viewContext = React.useMemo(
		() => ({ isPending: validate.isPending, ask }),
		[validate.isPending, ask],
	);

	return (
		<ViewContext.Provider value={viewContext}>
			<PageTemplate
				title="Pending validation"
				description="Students who asked to join your tutorials, grouped by tutorial."
				breadcrumbs={[
					{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
					{
						name: "Pending validation",
						redirect: PATH.PENDING_VALIDATION,
						isClickable: false,
					},
				]}
			>
				<div className="flex flex-wrap items-end justify-between gap-3 border-gray-200 border-b">
					<Tabs
						value={status}
						onChange={(_, next: StudentStatus) => changeStatus(next)}
						aria-label="Filter requests by status"
						sx={{
							minHeight: 44,
							"& .MuiTab-root": {
								textTransform: "none",
								fontWeight: 500,
								fontSize: 14,
								minHeight: 44,
								minWidth: 90,
							},
						}}
					>
						{TABS.map((t) => (
							<Tab key={t.value} value={t.value} label={t.label} />
						))}
					</Tabs>
					<TextField
						value={searchInput}
						onChange={(e) => changeSearch(e.target.value)}
						placeholder="Name, username or school"
						size="small"
						type="search"
						sx={{ width: { xs: "100%", sm: 320 }, mb: 1 }}
						slotProps={{
							htmlInput: {
								"aria-label": "Search students by name, username or school",
							},
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<Search size={16} aria-hidden />
									</InputAdornment>
								),
								endAdornment: searchInput ? (
									<InputAdornment position="end">
										<button
											type="button"
											onClick={() => changeSearch("")}
											aria-label="Clear search"
											className="rounded p-0.5 text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600"
										>
											<X size={16} aria-hidden />
										</button>
									</InputAdornment>
								) : undefined,
							},
						}}
					/>
				</div>

				{canAct && total > 0 && (
					<section
						aria-label="Bulk actions"
						className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"
					>
						<span className="text-sm font-medium text-brand-900">
							{plural(total)} selected
						</span>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={clear}
								disabled={validate.isPending}
							>
								Clear
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => ask("decline", batch)}
								disabled={validate.isPending}
							>
								Reject selected
							</Button>
							<Button
								variant="brand"
								size="sm"
								onClick={() => ask("accept", batch)}
								isLoading={validate.isPending}
							>
								Accept selected
							</Button>
						</div>
					</section>
				)}

				{isError ? (
					<DashboardError message={error.message} onRetry={() => refetch()} />
				) : (
					<div
						className={clsxm(
							isPlaceholderData && "opacity-60 transition-opacity",
						)}
					>
						<Table
							data={groups}
							columns={columns}
							isLoading={isLoading}
							omitSort
							defaultExpanded
							withPaginationControl
							manualPagination
							pagination={{ page, size: PAGE_SIZE }}
							onPaginationChange={(p) => setPage(p.page)}
							pageCount={meta?.total_pages ?? 1}
							renderSubComponent={(row) => {
								const g = row.original;
								const code = g.tutorial.custom_id;
								return (
									<StudentsSubTable
										students={g.pending_validations}
										canAct={canAct}
										selectedIds={selection[code] ?? []}
										busyUserIds={busyIds}
										onOpen={setOpenId}
										onToggle={(userId) => toggle(code, userId)}
										onToggleAll={() =>
											toggleAll(
												code,
												g.pending_validations.map((s) => s.user_id),
											)
										}
										onAct={(userId, action) =>
											ask(
												action,
												[{ tutorialCode: code, userIds: [userId] }],
												g.pending_validations.find((x) => x.user_id === userId)
													?.name,
											)
										}
									/>
								);
							}}
						/>
						{!isLoading && groups.length === 0 && (
							<p className="mt-4 text-center text-sm text-gray-500">
								{search
									? `No students match "${search}".`
									: status === "pending"
										? "No requests waiting. New requests will show up here."
										: `No ${status === "accepted" ? "accepted" : "rejected"} students yet.`}
							</p>
						)}
					</div>
				)}

				<StudentDrawer studentId={openId} onClose={() => setOpenId(null)} />

				<ConfirmationDialog
					isOpen={confirm !== null}
					setIsOpen={(open) => !open && setConfirm(null)}
					message={confirm?.message ?? ""}
					confirmLabel={confirm?.action === "accept" ? "Accept" : "Reject"}
					cancelLabel="Cancel"
					confirmVariant={confirm?.action === "accept" ? "brand" : "red"}
					onConfirm={() => confirm && run(confirm.action, confirm.batch)}
				/>
			</PageTemplate>
		</ViewContext.Provider>
	);
}
