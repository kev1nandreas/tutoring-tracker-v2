"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Fragment, useState } from "react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { formatDay, todayISO } from "@/lib/helper";
import type { Meeting } from "@/types/meeting";
import MeetingRow from "./MeetingRow";

type Props = { meetings?: Meeting[]; isLoading: boolean };

type View = "all" | "upcoming" | "past";

/** Today marker, drawn like the "now" line on the timetable. */
function TodayLine({ today }: { today: string }) {
	return (
		<li
			aria-label={`Today, ${formatDay(today)}`}
			className="flex items-center gap-2 py-1 text-xs font-medium text-[#c23a2b]"
		>
			<span className="h-2 w-2 shrink-0 rounded-full bg-[#c23a2b]" />
			<span className="h-[2px] flex-1 bg-[#c23a2b]" />
			<span>Today · {formatDay(today)}</span>
		</li>
	);
}

const EMPTY_TEXT: Record<View, string> = {
	all: "No meetings yet. They will appear here once they are scheduled.",
	upcoming: "Nothing coming up.",
	past: "No past meetings.",
};

export default function MeetingLedger({ meetings = [], isLoading }: Props) {
	const [view, setView] = useState<View>("all");
	const today = todayISO();
	const dateOf = (m: Meeting) => m.date.slice(0, 10);

	// Meetings arrive oldest first. "Upcoming" starts at the first one dated today or later.
	const upcomingCount = meetings.filter((m) => dateOf(m) >= today).length;
	const pastCount = meetings.length - upcomingCount;
	const nextId = meetings.find((m) => dateOf(m) >= today && !m.is_done)?.id;

	const visible =
		view === "upcoming"
			? meetings.filter((m) => dateOf(m) >= today)
			: view === "past"
				? meetings.filter((m) => dateOf(m) < today)
				: meetings;

	// The today line only makes sense when both sides are on screen.
	const showToday = view === "all";
	const firstUpcoming = visible.findIndex((m) => dateOf(m) >= today);
	const todayAt = firstUpcoming === -1 ? visible.length : firstUpcoming;

	return (
		<DashboardCard
			title="Meetings"
			count={meetings.length}
			isLoading={isLoading}
			isEmpty={meetings.length === 0}
			emptyText={EMPTY_TEXT.all}
		>
			<Tabs
				value={view}
				onChange={(_, next: View) => setView(next)}
				aria-label="Filter meetings"
				sx={{
					minHeight: 40,
					mt: -1,
					mb: 1,
					borderBottom: 1,
					borderColor: "divider",
					"& .MuiTab-root": {
						textTransform: "none",
						fontWeight: 500,
						fontSize: 14,
						minHeight: 40,
						minWidth: 72,
					},
				}}
			>
				<Tab value="all" label="All" />
				<Tab value="upcoming" label={`Upcoming (${upcomingCount})`} />
				<Tab value="past" label={`Past (${pastCount})`} />
			</Tabs>

			{visible.length === 0 ? (
				<p className="py-8 text-center text-sm text-gray-400">
					{EMPTY_TEXT[view]}
				</p>
			) : (
				<ul className="divide-y divide-gray-100">
					{visible.map((m, i) => (
						<Fragment key={m.id}>
							{showToday && i === todayAt && <TodayLine today={today} />}
							<MeetingRow
								meeting={m}
								isNext={m.id === nextId}
								isPast={dateOf(m) < today}
							/>
						</Fragment>
					))}
					{showToday && todayAt === visible.length && (
						<TodayLine today={today} />
					)}
				</ul>
			)}
		</DashboardCard>
	);
}
