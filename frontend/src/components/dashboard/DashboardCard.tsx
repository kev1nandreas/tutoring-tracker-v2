"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import Typography from "@/components/Typography";
import clsxm from "@/lib/clsxm";

type DashboardCardProps = {
	title: string;
	/** Small number shown next to the title (list size). */
	count?: number;
	description?: string;
	isLoading?: boolean;
	isEmpty?: boolean;
	emptyText?: string;
	/** Right side of the header, e.g. an "Add" button. */
	action?: React.ReactNode;
	/** Shown under the empty text, e.g. a call to action. */
	emptyAction?: React.ReactNode;
	className?: string;
	/** Lets the user fold the card away to its header (an accordion). */
	collapsible?: boolean;
	/** Whether a collapsible card starts open. */
	defaultOpen?: boolean;
	children: React.ReactNode;
};

/** Titled card that handles its own loading and empty state. */
export default function DashboardCard({
	title,
	count,
	description,
	isLoading,
	isEmpty,
	emptyText = "Nothing here yet.",
	action,
	emptyAction,
	className,
	collapsible,
	defaultOpen = true,
	children,
}: DashboardCardProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const bodyId = useId();
	const open = !collapsible || isOpen;

	const heading = (
		<>
			<Typography as="h2" weight="semibold" className="text-base text-gray-900">
				{title}
			</Typography>
			{description && (
				<Typography className="mt-0.5 text-xs text-gray-500">
					{description}
				</Typography>
			)}
		</>
	);

	return (
		<section
			className={clsxm(
				"flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white",
				className,
			)}
		>
			<header
				className={clsxm(
					"flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 py-4 sm:px-5",
					open && "border-b border-gray-100",
				)}
			>
				{collapsible ? (
					<button
						type="button"
						onClick={() => setIsOpen((v) => !v)}
						aria-expanded={isOpen}
						aria-controls={bodyId}
						className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						<ChevronDown
							size={18}
							aria-hidden
							className={clsxm(
								"mt-0.5 shrink-0 text-gray-400 transition-transform group-hover:text-gray-600 motion-reduce:transition-none",
								!isOpen && "-rotate-90",
							)}
						/>
						<span className="min-w-0">{heading}</span>
					</button>
				) : (
					<div className="min-w-0">{heading}</div>
				)}
				<div className="flex flex-wrap items-center gap-3">
					{typeof count === "number" && !isLoading && (
						<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
							{count}
						</span>
					)}
					{action}
				</div>
			</header>

			<div
				id={bodyId}
				hidden={!open}
				className="min-w-0 flex-1 px-4 py-4 sm:px-5"
			>
				{isLoading ? (
					<div className="flex flex-col gap-3" aria-busy="true">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="h-11 animate-pulse rounded-lg bg-gray-100"
							/>
						))}
					</div>
				) : isEmpty ? (
					<div className="flex flex-col items-center gap-3 py-6">
						<Typography className="text-center text-sm text-gray-400">
							{emptyText}
						</Typography>
						{emptyAction}
					</div>
				) : (
					children
				)}
			</div>
		</section>
	);
}
