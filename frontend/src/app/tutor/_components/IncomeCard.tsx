import DashboardCard from "@/components/dashboard/DashboardCard";
import StatTile from "@/components/dashboard/StatTile";
import ViewAllLink from "@/components/dashboard/ViewAllLink";
import { formatCurrency } from "@/lib/helper";
import { PATH } from "@/shared/path";
import type { Income } from "@/types/dashboard";

type Props = { income?: Income; isLoading: boolean };

const monthName = (yyyyMm: string) =>
	new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
		new Date(`${yyyyMm}-01T00:00:00`),
	);

const payments = (n: number) => `${n} ${n === 1 ? "payment" : "payments"}`;

export default function IncomeCard({ income, isLoading }: Props) {
	return (
		<DashboardCard
			title="Income"
			description="Paid payments only"
			isLoading={isLoading}
			action={<ViewAllLink href={PATH.PAYMENTS}>Payments</ViewAllLink>}
		>
			{income && (
				<div className="grid gap-3 sm:grid-cols-2">
					<StatTile
						label={monthName(income.month)}
						value={formatCurrency(income.this_month)}
						hint={payments(income.payments_month)}
						href={PATH.PAYMENTS}
					/>
					<StatTile
						label={String(income.year)}
						value={formatCurrency(income.this_year)}
						hint={payments(income.payments_year)}
						href={PATH.PAYMENTS}
					/>
				</div>
			)}
		</DashboardCard>
	);
}
