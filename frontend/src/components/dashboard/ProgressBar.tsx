type ProgressBarProps = { value: number; max: number; label?: string };

export default function ProgressBar({ value, max, label }: ProgressBarProps) {
	const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

	return (
		<div>
			<div
				role="progressbar"
				aria-valuenow={value}
				aria-valuemin={0}
				aria-valuemax={max}
				aria-label={label}
				className="h-1.5 overflow-hidden rounded-full bg-gray-100"
			>
				<div
					className="h-full rounded-full bg-brand-600"
					style={{ width: `${percent}%` }}
				/>
			</div>
			{label && <p className="mt-1 text-xs text-gray-500">{label}</p>}
		</div>
	);
}
