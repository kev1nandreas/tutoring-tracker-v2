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
import {
	type CreateTutorialRequest,
	createTutorialSchema,
	type Tutorial,
} from "@/types/tutorial";
import { useCreateTutorialMutation } from "../_hooks/useCreateTutorialMutation";
import { useUpdateTutorialMutation } from "../_hooks/useUpdateTutorialMutation";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	/** Pass a tutorial to edit it; omit to create a new one. */
	tutorial?: Tutorial;
};

const EMPTY: CreateTutorialRequest = {
	name: "",
	date_started: "",
	date_ended: "",
	description: "",
	is_done: false,
	show_download: false,
	show_attendance: false,
	show_feedback: false,
	bundle_include_recordings: false,
	bundle_include_homework: true,
};

const toFormValues = (t: Tutorial): CreateTutorialRequest => ({
	name: t.name,
	date_started: t.date_started.slice(0, 10),
	date_ended: t.date_ended.slice(0, 10),
	description: t.description,
	is_done: t.is_done,
	show_download: t.show_download,
	show_attendance: t.show_attendance,
	show_feedback: t.show_feedback,
	bundle_include_recordings: t.bundle_include_recordings,
	bundle_include_homework: t.bundle_include_homework,
});

/** Add or edit a tutorial; the same fields either way. */
export default function TutorialFormDialog({
	isOpen,
	onClose,
	tutorial,
}: Props) {
	const isEdit = Boolean(tutorial);

	const methods = useForm<CreateTutorialRequest>({
		resolver: zodResolver(createTutorialSchema),
		defaultValues: tutorial ? toFormValues(tutorial) : EMPTY,
	});

	// Start from the current values each time the dialog opens.
	const { reset, control } = methods;
	const showDownload = useWatch({ control, name: "show_download" });
	React.useEffect(() => {
		if (isOpen) reset(tutorial ? toFormValues(tutorial) : EMPTY);
	}, [isOpen, tutorial, reset]);

	const create = useCreateTutorialMutation({ onSuccess: onClose });
	const update = useUpdateTutorialMutation(tutorial?.id ?? "", {
		onSuccess: onClose,
	});
	const mutation = isEdit ? update : create;

	const onSubmit: SubmitHandler<CreateTutorialRequest> = (data) =>
		mutation.mutate(data);

	return (
		<Dialog
			open={isOpen}
			onClose={mutation.isPending ? undefined : onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>
				{isEdit ? "Edit tutorial" : "Add tutorial"}
			</DialogTitle>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
					<DialogContent
						sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
					>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Name
							</LabelText>
							<Input
								id="name"
								placeholder="e.g. Algebra for Grade 10"
								autoFocus
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Start date
								</LabelText>
								<Input id="date_started" type="date" />
							</div>
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									End date
								</LabelText>
								<Input id="date_ended" type="date" />
							</div>
						</div>

						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Description
							</LabelText>
							<TextArea
								id="description"
								rows={3}
								maxLength={255}
								placeholder="What will students learn?"
							/>
						</div>

						{isEdit && (
							<SwitchInput
								id="is_done"
								label="Mark as done"
								helperText="Finished tutorials leave the active lists."
							/>
						)}

						<fieldset className="flex flex-col gap-1 rounded-lg border border-gray-200 px-4 py-3">
							<legend className="px-1 text-sm font-semibold text-gray-700">
								Student access
							</legend>
							<SwitchInput
								id="show_download"
								label="Download everything"
								helperText="Students can download all files of this class, with a summary PDF, as one zip."
							/>
							{showDownload && (
								<div className="ml-14 flex flex-col gap-1 border-l-2 border-gray-100 pl-4">
									<p className="text-xs font-medium text-gray-500">
										The summary PDF includes
									</p>
									<SwitchInput
										id="bundle_include_homework"
										label="Homework"
										helperText="Instructions, plus the student's own submission, grade and feedback."
									/>
									<SwitchInput
										id="bundle_include_recordings"
										label="Recording links"
										helperText="The YouTube link of each meeting. Students can then open it on YouTube."
									/>
								</div>
							)}
							<SwitchInput
								id="show_attendance"
								label="Attendance"
								helperText="Students check in to each meeting with a photo, on the day of the meeting."
							/>
							<SwitchInput
								id="show_feedback"
								label="Feedback"
								helperText="Students can see feedback and marks."
							/>
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
							{isEdit ? "Save changes" : "Create tutorial"}
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
