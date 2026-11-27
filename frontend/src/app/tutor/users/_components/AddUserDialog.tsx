"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
	GraduationCap,
	type LucideIcon,
	ShieldCheck,
	Users,
} from "lucide-react";
import * as React from "react";
import {
	Controller,
	FormProvider,
	type SubmitHandler,
	useForm,
} from "react-hook-form";
import z from "zod";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import clsxm from "@/lib/clsxm";
import { registerRequestSchema } from "@/types/register";
import type { Role } from "@/types/user";
import { useCreateUserMutation } from "../_hooks/useUsers";

const schema = registerRequestSchema.and(
	z.object({ role: z.enum(["admin", "tutor", "student"]) }),
);
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
	role: "student",
	name: "",
	school: "",
	phone: "",
	email: "",
	username: "",
	password: "",
	confirm_password: "",
};

const ROLES: { value: Role; label: string; hint: string; icon: LucideIcon }[] =
	[
		{
			value: "student",
			label: "Student",
			hint: "Joins classes with a code",
			icon: GraduationCap,
		},
		{
			value: "tutor",
			label: "Tutor",
			hint: "Runs their own tutorials",
			icon: Users,
		},
		{
			value: "admin",
			label: "Admin",
			hint: "Everything, every tutorial",
			icon: ShieldCheck,
		},
	];

const FIELDS: {
	id: Exclude<keyof Values, "role">;
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

/** Creates an account of any role. Share the email and password with the person yourself. */
export default function AddUserDialog({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const methods = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: EMPTY,
	});
	const { reset, control } = methods;
	React.useEffect(() => {
		if (isOpen) reset(EMPTY);
	}, [isOpen, reset]);

	const create = useCreateUserMutation({ onSuccess: onClose });
	const onSubmit: SubmitHandler<Values> = (data) => create.mutate(data);

	return (
		<Dialog
			open={isOpen}
			onClose={create.isPending ? undefined : onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>Add new user</DialogTitle>
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
					<DialogContent
						sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
					>
						<fieldset>
							<legend className="mb-1.5 text-sm font-semibold text-gray-900">
								Role
							</legend>
							<Controller
								name="role"
								control={control}
								render={({ field }) => (
									<div className="grid gap-2 sm:grid-cols-3">
										{ROLES.map(({ value, label, hint, icon: Icon }) => {
											const on = field.value === value;
											return (
												<label
													key={value}
													className={clsxm(
														"flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand-600",
														on
															? "border-brand-600 bg-brand-50"
															: "border-gray-200 hover:border-gray-300",
													)}
												>
													<input
														type="radio"
														name={field.name}
														value={value}
														checked={on}
														onChange={() => field.onChange(value)}
														className="sr-only"
													/>
													<Icon
														size={18}
														aria-hidden
														className={clsxm(
															"mt-0.5 shrink-0",
															on ? "text-brand-700" : "text-gray-400",
														)}
													/>
													<span className="min-w-0">
														<span className="block text-sm font-medium text-gray-900">
															{label}
														</span>
														<span className="block text-xs text-gray-500">
															{hint}
														</span>
													</span>
												</label>
											);
										})}
									</div>
								)}
							/>
						</fieldset>

						<div className="grid gap-4 sm:grid-cols-2">
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
									/>
								</div>
							))}
						</div>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2.5 }}>
						<Button
							variant="outline"
							onClick={onClose}
							disabled={create.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" variant="brand" isLoading={create.isPending}>
							Add user
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
