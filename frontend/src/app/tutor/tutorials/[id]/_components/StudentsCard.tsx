"use client";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";
import StudentDrawer from "@/app/tutor/students/_components/StudentDrawer";
import Button from "@/components/button/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import { validationQuestion } from "@/lib/enrollmentMessages";
import { formatRelativeTime, getInitials } from "@/lib/helper";
import type {
	StudentStatus,
	TutorialStudent,
	ValidateAction,
} from "@/types/student";
import {
	useTutorialStudents,
	useUnenrollStudentMutation,
	useValidateStudentMutation,
} from "../_hooks/useTutorialStudents";

type Props = { tutorialId: string; tutorialCode: string };

const EMPTY: Record<StudentStatus, string> = {
	accepted:
		"No students yet. Share the tutorial code so students can request to join.",
	pending: "No requests waiting.",
	declined: "No rejected requests.",
};

function StudentRow({
	student,
	actions,
	onOpen,
}: {
	student: TutorialStudent;
	actions?: React.ReactNode;
	onOpen: (userId: string) => void;
}) {
	return (
		<li className="flex items-center gap-3 py-3">
			<span
				aria-hidden
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700"
			>
				{getInitials(student.name)}
			</span>
			<button
				type="button"
				onClick={() => onOpen(student.user_id)}
				className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<p className="truncate text-sm font-medium text-gray-900 hover:text-brand-700 hover:underline">
					{student.name}
				</p>
				<p className="truncate text-xs text-gray-500">
					@{student.username}
					{student.school ? ` · ${student.school}` : ""}
				</p>
				<p className="truncate text-xs text-gray-400">
					Last login:{" "}
					{student.last_login_at
						? formatRelativeTime(student.last_login_at)
						: "never"}
				</p>
			</button>
			{actions}
		</li>
	);
}

export default function StudentsCard({ tutorialId, tutorialCode }: Props) {
	const [tab, setTab] = useState<StudentStatus>("accepted");
	const [openId, setOpenId] = useState<string | null>(null);

	// all three load up front so the tab labels can show counts
	const accepted = useTutorialStudents(tutorialId, "accepted");
	const pending = useTutorialStudents(tutorialId, "pending");
	const declined = useTutorialStudents(tutorialId, "declined");
	const queries = { accepted, pending, declined };
	const current = queries[tab];

	const [confirm, setConfirm] = useState<{
		student: TutorialStudent;
		action: ValidateAction;
	} | null>(null);

	const [removing, setRemoving] = useState<TutorialStudent | null>(null);

	const validate = useValidateStudentMutation(tutorialId, tutorialCode);
	const unenroll = useUnenrollStudentMutation(tutorialId);
	const busyId = validate.isPending ? validate.variables?.userId : undefined;

	const count = (s: StudentStatus) =>
		queries[s].data ? ` (${queries[s].data.total})` : "";
	const items = current.data?.items ?? [];

	return (
		<DashboardCard
			title="Students"
			description={`Share the code ${tutorialCode} so students can request to join.`}
			count={accepted.data?.total}
			isLoading={accepted.isLoading && tab === "accepted"}
		>
			<Tabs
				variant="scrollable"
				scrollButtons={false}
				value={tab}
				onChange={(_, next: StudentStatus) => setTab(next)}
				aria-label="Filter students by status"
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
				<Tab value="accepted" label={`Enrolled${count("accepted")}`} />
				<Tab value="pending" label={`Requests${count("pending")}`} />
				<Tab value="declined" label={`Rejected${count("declined")}`} />
			</Tabs>

			{current.isError ? (
				<div
					role="alert"
					className="flex items-center justify-between gap-3 py-4 text-sm text-red-700"
				>
					{current.error.message}
					<Button variant="outline" size="sm" onClick={() => current.refetch()}>
						Try again
					</Button>
				</div>
			) : current.isLoading ? (
				<div className="flex flex-col gap-3" aria-busy="true">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							className="h-12 animate-pulse rounded-lg bg-gray-100"
						/>
					))}
				</div>
			) : items.length === 0 ? (
				<p className="py-8 text-center text-sm text-gray-400">{EMPTY[tab]}</p>
			) : (
				<ul className="divide-y divide-gray-100">
					{items.map((student) => (
						<StudentRow
							key={student.id}
							student={student}
							onOpen={setOpenId}
							actions={
								tab === "pending" ? (
									<div className="flex shrink-0 gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={busyId === student.user_id}
											onClick={() => setConfirm({ student, action: "decline" })}
										>
											Reject
										</Button>
										<Button
											variant="brand"
											size="sm"
											isLoading={busyId === student.user_id}
											onClick={() => setConfirm({ student, action: "accept" })}
										>
											Accept
										</Button>
									</div>
								) : tab === "accepted" ? (
									<Button
										variant="outline"
										size="sm"
										isLoading={
											unenroll.isPending &&
											unenroll.variables === student.user_id
										}
										disabled={unenroll.isPending}
										onClick={() => setRemoving(student)}
									>
										Remove
									</Button>
								) : undefined
							}
						/>
					))}
				</ul>
			)}
			<StudentDrawer studentId={openId} onClose={() => setOpenId(null)} />
			<ConfirmationDialog
				isOpen={confirm !== null}
				setIsOpen={(open) => !open && setConfirm(null)}
				message={
					confirm
						? validationQuestion(confirm.action, confirm.student.name)
						: ""
				}
				confirmLabel={confirm?.action === "accept" ? "Accept" : "Reject"}
				cancelLabel="Cancel"
				confirmVariant={confirm?.action === "accept" ? "brand" : "red"}
				onConfirm={() =>
					confirm &&
					validate.mutate({
						userId: confirm.student.user_id,
						action: confirm.action,
					})
				}
			/>
			<ConfirmationDialog
				isOpen={removing !== null}
				setIsOpen={(open) => !open && setRemoving(null)}
				message={
					removing
						? `Remove ${removing.name} from this tutorial? They lose access to its meetings and materials, and can ask to join again. Their attendance and homework are kept.`
						: ""
				}
				confirmLabel="Remove"
				cancelLabel="Cancel"
				confirmVariant="red"
				onConfirm={() => removing && unenroll.mutate(removing.user_id)}
			/>
		</DashboardCard>
	);
}
