"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardError from "@/components/dashboard/DashboardError";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import Table from "@/components/table/Table";
import PageTemplate from "@/layouts/template/PageTemplate";
import clsxm from "@/lib/clsxm";
import { formatCurrency, formatDate } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { Payment, PaymentFilter } from "@/types/payment";
import { useDeletePaymentMutation } from "../_hooks/usePaymentMutations";
import { usePayments } from "../_hooks/usePayments";
import PaymentFormDialog from "./PaymentFormDialog";

const PAGE_SIZE = 10;

const FILTERS: { value: PaymentFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "paid", label: "Paid" },
	{ value: "unpaid", label: "Unpaid" },
];

export default function PaymentsView() {
	const [filter, setFilter] = React.useState<PaymentFilter>("all");
	const [page, setPage] = React.useState(1);
	const [isAddOpen, setIsAddOpen] = React.useState(false);
	const [editing, setEditing] = React.useState<Payment | undefined>();
	const [deleting, setDeleting] = React.useState<Payment | undefined>();

	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		usePayments({ page, pageSize: PAGE_SIZE, filter });
	const remove = useDeletePaymentMutation({
		onSuccess: () => setDeleting(undefined),
	});

	const columns = React.useMemo<ColumnDef<Payment, unknown>[]>(
		() => [
			{
				id: "tutorial",
				header: "Tutorial",
				meta: { align: "left" },
				cell: ({ row }) => (
					<span className="font-medium text-gray-900">
						{row.original.tutorial?.name ?? "–"}
					</span>
				),
			},
			{
				id: "nominal",
				header: "Amount",
				meta: { align: "left" },
				cell: ({ row }) => formatCurrency(row.original.nominal),
			},
			{
				id: "date",
				header: "Date",
				meta: { align: "left" },
				cell: ({ row }) =>
					row.original.payment_date > 0
						? formatDate(
								new Date(row.original.payment_date * 1000).toISOString(),
							)
						: "–",
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (
					<span
						className={clsxm(
							"rounded-full px-2.5 py-0.5 text-xs font-semibold",
							row.original.is_paid
								? "bg-green-50 text-green-700"
								: "bg-amber-50 text-amber-700",
						)}
					>
						{row.original.is_paid ? "Paid" : "Unpaid"}
					</span>
				),
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						<button
							type="button"
							onClick={() => setEditing(row.original)}
							aria-label="Edit payment"
							className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<Pencil size={16} aria-hidden />
						</button>
						<button
							type="button"
							onClick={() => setDeleting(row.original)}
							aria-label="Delete payment"
							className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<Trash2 size={16} aria-hidden />
						</button>
					</div>
				),
			},
		],
		[],
	);

	return (
		<PageTemplate
			title="Payments"
			description="Payments for your tutorials. Each one is also added to your personal website income."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{ name: "Payments", redirect: PATH.PAYMENTS, isClickable: false },
			]}
			action={
				<Button
					variant="brand"
					leftIcon={Plus}
					onClick={() => setIsAddOpen(true)}
				>
					Add payment
				</Button>
			}
		>
			<Tabs
				variant="scrollable"
				scrollButtons={false}
				value={filter}
				onChange={(_, value: PaymentFilter) => {
					setFilter(value);
					setPage(1);
				}}
				aria-label="Filter payments"
			>
				{FILTERS.map((f) => (
					<Tab key={f.value} value={f.value} label={f.label} />
				))}
			</Tabs>

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
						omitSort
						withPaginationControl
						manualPagination
						pagination={{ page, size: PAGE_SIZE }}
						onPaginationChange={(p) => setPage(p.page)}
						pageCount={data?.meta?.total_pages ?? 1}
					/>
					{!isLoading && data?.items.length === 0 && (
						<p className="py-10 text-center text-sm text-gray-400">
							No payments here yet.
						</p>
					)}
				</div>
			)}

			<PaymentFormDialog
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
			/>
			<PaymentFormDialog
				isOpen={Boolean(editing)}
				onClose={() => setEditing(undefined)}
				payment={editing}
			/>
			<ConfirmationDialog
				isOpen={Boolean(deleting)}
				setIsOpen={(open) => !open && setDeleting(undefined)}
				message={`Delete the ${deleting ? formatCurrency(deleting.nominal) : ""} payment${deleting?.tutorial ? ` for ${deleting.tutorial.name}` : ""}? It is removed from your personal website income too.`}
				confirmLabel="Delete"
				cancelLabel="Cancel"
				confirmVariant="red"
				onConfirm={() => deleting && remove.mutate(deleting.id)}
			/>
		</PageTemplate>
	);
}
