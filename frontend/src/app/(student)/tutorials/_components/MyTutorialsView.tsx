"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import * as React from "react";
import Button from "@/components/button/Button";
import DashboardError from "@/components/dashboard/DashboardError";
import Typography from "@/components/Typography";
import clsxm from "@/lib/clsxm";
import { PATH } from "@/shared/path";
import type { EnrolledFilter } from "@/types/student-tutorial";
import { useMyTutorials } from "../_hooks/useMyTutorials";
import MyTutorialCard from "./MyTutorialCard";

const PAGE_SIZE = 9;

const TABS: { value: EnrolledFilter; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "done", label: "Finished" },
	{ value: "all", label: "All" },
];

export default function MyTutorialsView() {
	const [status, setStatus] = React.useState<EnrolledFilter>("active");
	const [page, setPage] = React.useState(1);

	const { data, isLoading, isError, error, refetch, isPlaceholderData } =
		useMyTutorials({
			page,
			pageSize: PAGE_SIZE,
			status,
		});
	const items = data?.items ?? [];
	const meta = data?.meta;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<Typography
						as="h1"
						weight="semibold"
						className="text-2xl text-gray-900"
					>
						My tutorials
					</Typography>
					<Typography className="text-sm text-gray-500">
						The classes you were accepted into.
					</Typography>
				</div>
				<Link
					href={PATH.ENROLL}
					className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
				>
					Join a class
				</Link>
			</div>

			<Tabs
				value={status}
				onChange={(_, next: EnrolledFilter) => {
					setStatus(next);
					setPage(1);
				}}
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
				{TABS.map((t) => (
					<Tab key={t.value} value={t.value} label={t.label} />
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
							className="h-56 animate-pulse rounded-xl bg-gray-100"
						/>
					))}
				</div>
			) : items.length === 0 ? (
				<div className="bg-graph flex flex-col items-center gap-3 rounded-xl border border-[#d8e0f0] px-6 py-16 text-center">
					<Typography weight="medium" className="text-gray-900">
						{status === "all"
							? "No tutorials yet"
							: status === "active"
								? "No active tutorials"
								: "No finished tutorials"}
					</Typography>
					<Typography className="max-w-sm text-sm text-gray-600">
						{status === "all"
							? "Ask your tutor for a class code, then join it. Once you are accepted, the class shows up here."
							: "Nothing to show in this tab."}
					</Typography>
					{status === "all" && (
						<Link
							href={PATH.ENROLL}
							className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
						>
							Join a class
						</Link>
					)}
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
							<MyTutorialCard key={t.id} tutorial={t} />
						))}
					</div>

					{meta && meta.total_pages > 1 && (
						<nav
							aria-label="Pagination"
							className="flex items-center justify-between"
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
		</div>
	);
}
