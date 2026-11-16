import Typography from "@/components/Typography";

type StatTileProps = { label: string; value: string; hint?: string };

export default function StatTile({ label, value, hint }: StatTileProps) {
	return (
		<div className="rounded-lg bg-gray-50 px-4 py-3">
			<Typography className="text-xs text-gray-500">{label}</Typography>
			<Typography weight="bold" className="mt-1 text-2xl text-gray-900">
				{value}
			</Typography>
			{hint && (
				<Typography className="mt-0.5 text-xs text-gray-500">{hint}</Typography>
			)}
		</div>
	);
}
