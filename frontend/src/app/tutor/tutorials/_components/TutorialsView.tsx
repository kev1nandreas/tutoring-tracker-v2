"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Plus } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import PageTemplate from "@/layouts/template/PageTemplate";
import clsxm from "@/lib/clsxm";
import { PATH } from "@/shared/path";
import type { TutorialStatus } from "@/types/tutorial";
import { useTutorialsQuery } from "../_hooks/useTutorialsQuery";
import TutorialCard from "./TutorialCard";
import TutorialFormDialog from "./TutorialFormDialog";

const PAGE_SIZE = 9;

const FILTERS: { value: TutorialStatus; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "done", label: "Done" },
	{ value: "all", label: "All" },
];

export default function TutorialsView() {
	const [status, setStatus] = React.useState<TutorialStatus>("active");
	const [page, setPage] = React.useState(1);
	const [isAddOpen, setIsAddOpen] = React.useState(false);

	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		useTutorialsQuery({
			page,
			pageSize: PAGE_SIZE,
			status,
		});

	const items = data?.items ?? [];
	const meta = data?.meta;

	const changeStatus = (next: TutorialStatus) => {
		setStatus(next);
		setPage(1);
	};

	return (
		<PageTemplate
			title="Tutorials"
			description="The tutorials you run."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
				{ name: "Tutorials", redirect: PATH.TUTORIALS, isClickable: false },
			]}
			action={
				<Button
					variant="brand"
					leftIcon={Plus}
					onClick={() => setIsAddOpen(true)}
				>
					Add tutorial
				</Button>
			}
		>
			<Tabs
				value={status}
				onChange={(_, next: TutorialStatus) => changeStatus(next)}
				aria-label="Filter tutorials by status"
				sx={{
					minHeight: 44,
					borderBottom: 1,
					borderColor: "divider",
					"& .MuiTab-root": {
						textTransform: "none",
						fontWeight: 500,
						fontSize: 14,
						minHeight: 44,
						minWidth: 80,
					},
				}}
			>
				{FILTERS.map((f) => (
					<Tab key={f.value} value={f.value} label={f.label} />
				))}
			</Tabs>

			{isError ? (
				<DashboardError message={error.message} onRetry={() => refetch()} />
			) : isLoading ? (
				<div
					className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					aria-busy="true"
				>
					{Array.from({ length: 6 }, (_, i) => (
						<div
							key={`sk-${i + 1}`}
							className="h-48 animate-pulse rounded-xl bg-gray-100"
						/>
					))}
				</div>
			) : items.length === 0 ? (
				<div className="bg-graph flex flex-col items-center gap-3 rounded-xl border border-[#d8e0f0] px-6 py-16 text-center">
					<Typography weight="medium" className="text-gray-900">
						{status === "all" ? "No tutorials yet" : `No ${status} tutorials`}
					</Typography>
					<Typography className="text-sm text-gray-500">
						Create a tutorial, then add its meetings and students.
					</Typography>
					<Button
						variant="brand"
						leftIcon={Plus}
						onClick={() => setIsAddOpen(true)}
					>
						Add tutorial
					</Button>
				</div>
			) : (
				<>
					<div
						className={clsxm(
							"grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
							isPlaceholderData && "opacity-60 transition-opacity",
						)}
					>
						{items.map((t) => (
							<TutorialCard key={t.id} tutorial={t} />
						))}
					</div>

					{meta && meta.total_pages > 1 && (
						<nav
							aria-label="Pagination"
							className="mt-2 flex items-center justify-between"
						>
							<Typography className="text-sm text-gray-500">
								Page {meta.page} of {meta.total_pages} · {meta.total_items}{" "}
								tutorials
							</Typography>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={!meta.has_prev}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!meta.has_next}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						</nav>
					)}
				</>
			)}

			<TutorialFormDialog
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
			/>
		</PageTemplate>
	);
}
