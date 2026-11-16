"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import SwitchInput from "@/components/form/SwitchInput";
import TextArea from "@/components/form/TextArea";
import {
	type CreateTutorialRequest,
	createTutorialSchema,
} from "@/types/tutorial";
import { useCreateTutorialMutation } from "../_hooks/useCreateTutorialMutation";

type Props = { isOpen: boolean; onClose: () => void };

const EMPTY: CreateTutorialRequest = {
	name: "",
	date_started: "",
	date_ended: "",
	description: "",
	show_download: false,
	show_attendance: false,
	show_feedback: false,
};

export default function AddTutorialDialog({ isOpen, onClose }: Props) {
	const methods = useForm<CreateTutorialRequest>({
		resolver: zodResolver(createTutorialSchema),
		defaultValues: EMPTY,
	});

	const handleClose = () => {
		methods.reset(EMPTY);
		onClose();
	};

	const mutation = useCreateTutorialMutation({ onSuccess: handleClose });

	const onSubmit: SubmitHandler<CreateTutorialRequest> = (data) =>
		mutation.mutate(data);

	return (
		<Dialog
			open={isOpen}
			onClose={mutation.isPending ? undefined : handleClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>Add tutorial</DialogTitle>

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

						<fieldset className="flex flex-col gap-1 rounded-lg border border-gray-200 px-4 py-3">
							<legend className="px-1 text-sm font-semibold text-gray-700">
								Student access
							</legend>
							<SwitchInput
								id="show_download"
								label="Downloads"
								helperText="Students can download meeting attachments."
							/>
							<SwitchInput
								id="show_attendance"
								label="Attendance"
								helperText="Students can see their attendance."
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
							onClick={handleClose}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="brand"
							isLoading={mutation.isPending}
						>
							Create tutorial
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
