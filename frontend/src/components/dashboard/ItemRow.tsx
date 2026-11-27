import Typography from "@/components/Typography";
import RowLink from "./RowLink";

type ItemRowProps = {
	title: string;
	subtitle: string;
	/** Right-aligned text, usually a date. */
	aside?: string;
	asideHint?: string;
	badge?: React.ReactNode;
	/** Opens this page when the row is clicked. */
	href?: string;
};

/** Generic "title / subtitle ... date" list row. */
export default function ItemRow({
	title,
	subtitle,
	aside,
	asideHint,
	badge,
	href,
}: ItemRowProps) {
	return (
		<li className="py-1.5 first:pt-0 last:pb-0">
			<RowLink
				href={href}
				className="flex items-start justify-between gap-3 py-1.5"
			>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<Typography
							weight="medium"
							className="truncate text-sm text-gray-900"
						>
							{title}
						</Typography>
						{badge}
					</div>
					<Typography className="truncate text-xs text-gray-500">
						{subtitle}
					</Typography>
				</div>
				{aside && (
					<div className="shrink-0 text-right">
						<Typography weight="medium" className="text-sm text-gray-900">
							{aside}
						</Typography>
						{asideHint && (
							<Typography className="text-xs text-gray-500">
								{asideHint}
							</Typography>
						)}
					</div>
				)}
			</RowLink>
		</li>
	);
}
