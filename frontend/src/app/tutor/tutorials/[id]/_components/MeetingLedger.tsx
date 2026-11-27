"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FileUp, Plus } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import Button from "@/components/button/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import TodayLine from "@/components/dashboard/TodayLine";
import { sortByStart, todayISO } from "@/lib/helper";
import type { Meeting } from "@/types/meeting";
import ImportScheduleDialog from "./ImportScheduleDialog";
import MeetingDetailDrawer from "./MeetingDetailDrawer";
import MeetingFormDialog from "./MeetingFormDialog";
import MeetingRow from "./MeetingRow";

type Props = {
	tutorialId: string;
	/** The tutorial's attendance switch; undefined while it loads. */
	showAttendance?: boolean;
	meetings?: Meeting[];
	isLoading: boolean;
};

type View = "upcoming" | "past" | "all";

const EMPTY_TEXT: Record<View, string> = {
	all: "No meetings yet. They will appear here once they are scheduled.",
	upcoming: "Nothing coming up.",
	past: "No past meetings.",
};

export default function MeetingLedger({
	tutorialId,
	showAttendance,
	meetings: unsorted = [],
	isLoading,
}: Props) {
	const [view, setView] = useState<View>("upcoming");
	// by date, then start time (the API only orders by date)
	const meetings = useMemo(() => sortByStart(unsorted), [unsorted]);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [editing, setEditing] = useState<Meeting | null>(null);
	// keep the id, not the object, so the panel shows fresh data after an edit
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = meetings.find((m) => m.id === selectedId) ?? null;
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

	const addButton = (
		<div className="flex flex-wrap items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				leftIcon={FileUp}
				onClick={() => setIsImportOpen(true)}
			>
				Import from Excel
			</Button>
			<Button
				variant="brand"
				size="sm"
				leftIcon={Plus}
				onClick={() => setIsAddOpen(true)}
			>
				Add meeting
			</Button>
		</div>
	);

	return (
		<>
			<DashboardCard
				title="Meetings"
				collapsible
				count={meetings.length}
				isLoading={isLoading}
				isEmpty={meetings.length === 0}
				emptyText="No meetings yet. Add the first one to start the schedule."
				action={meetings.length > 0 ? addButton : undefined}
				emptyAction={addButton}
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
					<Tab value="past" label={`Past (${pastCount})`} />
					<Tab value="all" label="All" />
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
									showAttendance={showAttendance}
									isNext={m.id === nextId}
									isPast={dateOf(m) < today}
									onEdit={setEditing}
									onOpen={(meeting) => setSelectedId(meeting.id)}
									tutorialId={tutorialId}
								/>
							</Fragment>
						))}
						{showToday && todayAt === visible.length && (
							<TodayLine today={today} />
						)}
					</ul>
				)}
			</DashboardCard>

			<MeetingDetailDrawer
				meeting={selected}
				onClose={() => setSelectedId(null)}
				onEdit={(meeting) => {
					setSelectedId(null);
					setEditing(meeting);
				}}
				tutorialId={tutorialId}
				showAttendance={showAttendance}
			/>
			<ImportScheduleDialog
				isOpen={isImportOpen}
				onClose={() => setIsImportOpen(false)}
				tutorialId={tutorialId}
			/>
			<MeetingFormDialog
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
				tutorialId={tutorialId}
			/>
			<MeetingFormDialog
				isOpen={editing !== null}
				onClose={() => setEditing(null)}
				tutorialId={tutorialId}
				meeting={editing ?? undefined}
			/>
		</>
	);
}
