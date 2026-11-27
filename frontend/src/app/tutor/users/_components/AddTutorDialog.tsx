"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import { type RegisterRequest, registerRequestSchema } from "@/types/register";
import { useRegisterTutorMutation } from "../_hooks/useUsers";

const EMPTY: RegisterRequest = {
	name: "",
	school: "",
	phone: "",
	email: "",
	username: "",
	password: "",
	confirm_password: "",
};

const FIELDS: {
	id: keyof RegisterRequest;
	label: string;
	type?: string;
	placeholder?: string;
	autoComplete?: string;
}[] = [
	{ id: "name", label: "Name", placeholder: "Full name" },
	{ id: "username", label: "Username", autoComplete: "off" },
	{ id: "email", label: "Email", type: "email", autoComplete: "off" },
	{ id: "phone", label: "Phone", placeholder: "08xxxxxxxxxx" },
	{ id: "school", label: "School or institution" },
	{
		id: "password",
		label: "Password",
		type: "password",
		autoComplete: "new-password",
	},
	{
		id: "confirm_password",
		label: "Confirm password",
		type: "password",
		autoComplete: "new-password",
	},
];

/** Creates a tutor account. Share the email and password with them yourself. */
export default function AddTutorDialog({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const methods = useForm<RegisterRequest>({
		resolver: zodResolver(registerRequestSchema),
		defaultValues: EMPTY,
	});
	const { reset } = methods;
	React.useEffect(() => {
		if (isOpen) reset(EMPTY);
	}, [isOpen, reset]);

	const register = useRegisterTutorMutation({ onSuccess: onClose });
	const onSubmit: SubmitHandler<RegisterRequest> = (data) =>
		register.mutate(data);

	return (
		<Dialog
			open={isOpen}
			onClose={register.isPending ? undefined : onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>Add tutor</DialogTitle>
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
					<DialogContent
						sx={{
							display: "grid",
							gap: 2.5,
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
						}}
					>
						{FIELDS.map((f, i) => (
							<div key={f.id} className={i === 0 ? "sm:col-span-2" : ""}>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									{f.label}
								</LabelText>
								<Input
									id={f.id}
									type={f.type}
									placeholder={f.placeholder}
									autoComplete={f.autoComplete}
									autoFocus={i === 0}
								/>
							</div>
						))}
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2.5 }}>
						<Button
							variant="outline"
							onClick={onClose}
							disabled={register.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="brand"
							isLoading={register.isPending}
						>
							Add tutor
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
