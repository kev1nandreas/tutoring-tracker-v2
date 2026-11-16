"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Fragment, useMemo, useState } from "react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import TodayLine from "@/components/dashboard/TodayLine";
import { sortByStart, todayISO } from "@/lib/helper";
import type { StudentMeeting } from "@/types/student-meeting";
import StudentMeetingDrawer from "./StudentMeetingDrawer";
import StudentMeetingRow from "./StudentMeetingRow";
import VideoModal from "./VideoModal";

type Props = {
	meetings?: StudentMeeting[];
	isLoading: boolean;
	canAttend?: boolean;
};
type View = "upcoming" | "past" | "all";

const EMPTY: Record<View, string> = {
	all: "No meetings yet. Your tutor will add them here.",
	upcoming: "Nothing coming up.",
	past: "No past meetings.",
};

export default function StudentMeetingList({
	meetings: unsorted = [],
	isLoading,
	canAttend,
}: Props) {
	const [view, setView] = useState<View>("upcoming");
	// by date, then start time (the API only orders by date)
	const meetings = useMemo(() => sortByStart(unsorted), [unsorted]);
	// ids, not objects, so the panel and player always show fresh data
	const [openId, setOpenId] = useState<string | null>(null);
	const [watchId, setWatchId] = useState<string | null>(null);
	const opened = meetings.find((m) => m.id === openId) ?? null;
	const watching = meetings.find((m) => m.id === watchId) ?? null;
	const today = todayISO();
	const dateOf = (m: StudentMeeting) => m.date.slice(0, 10);

	// meetings arrive oldest first; "upcoming" starts at the first one dated today or later
	const upcomingCount = meetings.filter((m) => dateOf(m) >= today).length;
	const nextId = meetings.find((m) => dateOf(m) >= today && !m.is_done)?.id;

	const visible =
		view === "upcoming"
			? meetings.filter((m) => dateOf(m) >= today)
			: view === "past"
				? meetings.filter((m) => dateOf(m) < today)
				: meetings;

	const showToday = view === "all";
	const firstUpcoming = visible.findIndex((m) => dateOf(m) >= today);
	const todayAt = firstUpcoming === -1 ? visible.length : firstUpcoming;

	return (
		<>
			<DashboardCard
				title="Meetings"
				count={meetings.length}
				isLoading={isLoading}
				isEmpty={meetings.length === 0}
				emptyText={EMPTY.all}
			>
				<Tabs
					variant="scrollable"
					scrollButtons={false}
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
					<Tab value="upcoming" label={`Upcoming (${upcomingCount})`} />
					<Tab
						value="past"
						label={`Past (${meetings.length - upcomingCount})`}
					/>
					<Tab value="all" label="All" />
				</Tabs>

				{visible.length === 0 ? (
					<p className="py-8 text-center text-sm text-gray-400">
						{EMPTY[view]}
					</p>
				) : (
					<ul className="divide-y divide-gray-100">
						{visible.map((m, i) => (
							<Fragment key={m.id}>
								{showToday && i === todayAt && <TodayLine today={today} />}
								<StudentMeetingRow
									meeting={m}
									isNext={m.id === nextId}
									isToday={dateOf(m) === today}
									onOpen={(meeting) => setOpenId(meeting.id)}
									onWatch={(meeting) => setWatchId(meeting.id)}
								/>
							</Fragment>
						))}
						{showToday && todayAt === visible.length && (
							<TodayLine today={today} />
						)}
					</ul>
				)}
			</DashboardCard>

			<StudentMeetingDrawer
				meeting={opened}
				onClose={() => setOpenId(null)}
				onWatch={(meeting) => setWatchId(meeting.id)}
				canAttend={canAttend}
			/>
			<VideoModal
				videoId={watching?.video_id || null}
				title={watching?.title ?? ""}
				onClose={() => setWatchId(null)}
			/>
		</>
	);
}
