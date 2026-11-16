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
	className?: string;
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
	className,
	children,
}: DashboardCardProps) {
	return (
		<section
			className={clsxm(
				"flex flex-col rounded-xl border border-gray-200 bg-white",
				className,
			)}
		>
			<header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
				<div>
					<Typography
						as="h2"
						weight="semibold"
						className="text-base text-gray-900"
					>
						{title}
					</Typography>
					{description && (
						<Typography className="mt-0.5 text-xs text-gray-500">
							{description}
						</Typography>
					)}
				</div>
				{typeof count === "number" && !isLoading && (
					<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
						{count}
					</span>
				)}
			</header>

			<div className="flex-1 px-5 py-4">
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
					<Typography className="py-6 text-center text-sm text-gray-400">
						{emptyText}
					</Typography>
				) : (
					children
				)}
			</div>
		</section>
	);
}
