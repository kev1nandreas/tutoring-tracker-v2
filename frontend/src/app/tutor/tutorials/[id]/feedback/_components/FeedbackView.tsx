"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DashboardError from "@/components/dashboard/DashboardError";
import PageTemplate from "@/layouts/template/PageTemplate";
import { fetchFeedbackSummary } from "@/services/api/main/feedback";
import { PATH } from "@/shared/path";

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-[#d8e0f0] bg-white px-4 py-3">
			<dd className="text-2xl font-bold tabular-nums text-brand-950">
				{value}
			</dd>
			<dt className="text-xs text-gray-500">{label}</dt>
		</div>
	);
}

function Stars({ n }: { n: number }) {
	return (
		<span className="inline-flex" role="img" aria-label={`${n} of 5`}>
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					size={14}
					aria-hidden
					className={i <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}
				/>
			))}
		</span>
	);
}

export default function FeedbackView({ tutorialId }: { tutorialId: string }) {
	const q = useQuery({
		queryKey: ["tutorial", tutorialId, "feedback"],
		queryFn: () => fetchFeedbackSummary(tutorialId),
	});

	const crumbs = [
		{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: true },
		{ name: "Tutorials", redirect: PATH.TUTORIALS, isClickable: true },
		{
			name: "Tutorial",
			redirect: `${PATH.TUTORIALS}/${tutorialId}`,
			isClickable: true,
		},
		{ name: "Feedback", redirect: "", isClickable: false },
	];

	if (q.isError) {
		return (
			<PageTemplate title="Feedback" breadcrumbs={crumbs}>
				<DashboardError message={q.error.message} onRetry={() => q.refetch()} />
			</PageTemplate>
		);
	}
	const s = q.data;
	const avg = (n: number) => (s && s.count > 0 ? n.toFixed(1) : "–");

	return (
		<PageTemplate title="Feedback" breadcrumbs={crumbs}>
			<dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Stat label="Responses" value={String(s?.count ?? "–")} />
				<Stat label="Delivery (of 5)" value={avg(s?.avg_delivery ?? 0)} />
				<Stat label="Interactive (of 5)" value={avg(s?.avg_interactive ?? 0)} />
				<Stat label="Learn again (of 5)" value={avg(s?.avg_learn_again ?? 0)} />
			</dl>

			<div className="mt-4">
				<DashboardCard
					title="Responses"
					count={s?.count}
					isLoading={q.isLoading}
					isEmpty={s?.count === 0}
					emptyText="No feedback yet. Students are asked as soon as the feedback switch is on."
				>
					<ul className="divide-y divide-gray-100">
						{s?.items.map((f) => (
							<li
								key={f.created_at}
								className="flex flex-col gap-1.5 py-3 text-sm"
							>
								<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
									<span>
										Delivery <Stars n={f.delivery_rating} />
									</span>
									<span>
										Interactive <Stars n={f.interactive_rating} />
									</span>
									<span>
										Learn again <Stars n={f.learn_again_rating} />
									</span>
								</div>
								{f.unclear_topics && (
									<p>
										<b className="font-medium">Not understood yet:</b>{" "}
										{f.unclear_topics}
									</p>
								)}
								{f.message && (
									<p>
										<b className="font-medium">Message:</b> {f.message}
									</p>
								)}
							</li>
						))}
					</ul>
				</DashboardCard>
			</div>
		</PageTemplate>
	);
}
