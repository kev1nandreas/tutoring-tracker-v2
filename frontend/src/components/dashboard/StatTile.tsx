import Link from "next/link";
import Typography from "@/components/Typography";

type StatTileProps = {
	label: string;
	value: string;
	hint?: string;
	/** Opens this page when the tile is clicked. */
	href?: string;
};

export default function StatTile({ label, value, hint, href }: StatTileProps) {
	const body = (
		<>
			<Typography className="text-xs text-gray-500">{label}</Typography>
			<Typography weight="bold" className="mt-1 text-2xl text-gray-900">
				{value}
			</Typography>
			{hint && (
				<Typography className="mt-0.5 text-xs text-gray-500">{hint}</Typography>
			)}
		</>
	);
	if (!href)
		return <div className="rounded-lg bg-gray-50 px-4 py-3">{body}</div>;
	return (
		<Link
			href={href}
			className="block cursor-pointer rounded-lg bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
		>
			{body}
		</Link>
	);
}
