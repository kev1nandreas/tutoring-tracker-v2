import Button from "@/components/button/Button";
import Typography from "@/components/Typography";

type DashboardErrorProps = { message: string; onRetry: () => void };

export default function DashboardError({
	message,
	onRetry,
}: DashboardErrorProps) {
	return (
		<div
			role="alert"
			className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5"
		>
			<Typography className="text-sm text-red-700">{message}</Typography>
			<Button variant="outline" size="sm" onClick={onRetry}>
				Try again
			</Button>
		</div>
	);
}
