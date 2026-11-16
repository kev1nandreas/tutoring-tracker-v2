"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";
import {
	FormProvider,
	type SubmitHandler,
	useForm,
	useWatch,
} from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import SwitchInput from "@/components/form/SwitchInput";
import TextArea from "@/components/form/TextArea";
import { timeOf, todayISO } from "@/lib/helper";
import {
	type Meeting,
	type MeetingFormValues,
	meetingFormSchema,
} from "@/types/meeting";
import {
	useCreateMeetingMutation,
	useUpdateMeetingMutation,
} from "../_hooks/useMeetingMutations";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	tutorialId: string;
	/** Pass a meeting to edit it; omit to add a new one. */
	meeting?: Meeting;
};

const emptyValues = (): MeetingFormValues => ({
	title: "",
	date: todayISO(),
	time_start: "",
	time_end: "",
	youtube_link: "",
	marks: "",
	has_homework: false,
	text_homework: "",
	is_done: false,
});

const toFormValues = (m: Meeting): MeetingFormValues => ({
	title: m.title,
	date: m.date.slice(0, 10),
	time_start: timeOf(m.time_start),
	time_end: timeOf(m.time_end),
	youtube_link: m.youtube_link ?? "",
	marks: m.marks ?? "",
	has_homework: m.has_homework,
	text_homework: m.text_homework ?? "",
	is_done: m.is_done,
});

/** Add or edit a meeting; the same fields either way. */
export default function MeetingFormDialog({
	isOpen,
	onClose,
	tutorialId,
	meeting,
}: Props) {
	const isEdit = Boolean(meeting);

	const methods = useForm<MeetingFormValues>({
		resolver: zodResolver(meetingFormSchema),
		defaultValues: meeting ? toFormValues(meeting) : emptyValues(),
	});

	// Start from the current values each time the dialog opens.
	const { reset, control } = methods;
	React.useEffect(() => {
		if (isOpen) reset(meeting ? toFormValues(meeting) : emptyValues());
	}, [isOpen, meeting, reset]);

	const hasHomework = useWatch({ control, name: "has_homework" });

	const create = useCreateMeetingMutation(tutorialId, { onSuccess: onClose });
	const update = useUpdateMeetingMutation(meeting?.id ?? "", tutorialId, {
		onSuccess: onClose,
	});
	const mutation = isEdit ? update : create;

	const onSubmit: SubmitHandler<MeetingFormValues> = (data) =>
		mutation.mutate({
			...data,
			text_homework: data.has_homework ? data.text_homework : "",
		});

	return (
		<Dialog
			open={isOpen}
			onClose={mutation.isPending ? undefined : onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>
				{isEdit ? "Edit meeting" : "Add meeting"}
			</DialogTitle>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
					<DialogContent
						sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
					>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Title
							</LabelText>
							<Input
								id="title"
								placeholder="e.g. Quadratic equations"
								autoFocus
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Date
								</LabelText>
								<Input id="date" type="date" />
							</div>
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Starts
								</LabelText>
								<Input id="time_start" type="time" />
							</div>
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Ends
								</LabelText>
								<Input id="time_end" type="time" />
							</div>
						</div>

						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Recording link (optional)
							</LabelText>
							<Input
								id="youtube_link"
								type="url"
								placeholder="https://youtube.com/..."
							/>
						</div>

						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Notes (optional)
							</LabelText>
							<TextArea
								id="marks"
								rows={3}
								maxLength={255}
								placeholder="Marks, reminders or anything worth remembering"
							/>
						</div>

						<fieldset className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3">
							<legend className="px-1 text-sm font-semibold text-gray-700">
								Homework and status
							</legend>
							<SwitchInput
								id="has_homework"
								label="This meeting has homework"
								helperText="Students will see it as pending until they submit."
							/>
							{hasHomework && (
								<div>
									<LabelText labelTextClasname="mb-1.5 font-semibold">
										Homework instructions
									</LabelText>
									<TextArea
										id="text_homework"
										rows={3}
										maxLength={255}
										placeholder="What should students do?"
									/>
								</div>
							)}
							{isEdit && (
								<SwitchInput
									id="is_done"
									label="Mark as done"
									helperText="Use this once the meeting has taken place."
								/>
							)}
						</fieldset>
					</DialogContent>

					<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="brand"
							isLoading={mutation.isPending}
						>
							{isEdit ? "Save changes" : "Add meeting"}
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
