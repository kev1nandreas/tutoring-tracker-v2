"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import * as React from "react";
import {
	Controller,
	FormProvider,
	type SubmitHandler,
	useForm,
} from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import SelectInput from "@/components/form/SelectInput";
import SwitchInput from "@/components/form/SwitchInput";
import TextArea from "@/components/form/TextArea";
import { formatNumber, todayISO } from "@/lib/helper";
import {
	dateToUnix,
	type Payment,
	type PaymentFormValues,
	paymentFormSchema,
	unixToDate,
} from "@/types/payment";
import { useTutorialOptions } from "../_hooks/usePaymentFormOptions";
import { useSavePaymentMutation } from "../_hooks/usePaymentMutations";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	/** Pass a payment to edit it; omit to add a new one. */
	payment?: Payment;
};

const EMPTY: PaymentFormValues = {
	tutorial_id: "",
	nominal: "",
	payment_date: "",
	is_paid: true,
	note: "",
};

const toFormValues = (p: Payment): PaymentFormValues => ({
	tutorial_id: p.tutorial_id,
	nominal: String(p.nominal),
	payment_date: unixToDate(p.payment_date),
	is_paid: p.is_paid,
	note: p.note,
});

/** Add or edit a payment; the same fields either way. */
export default function PaymentFormDialog({ isOpen, onClose, payment }: Props) {
	const isEdit = Boolean(payment);

	const methods = useForm<PaymentFormValues>({
		resolver: zodResolver(paymentFormSchema),
		defaultValues: payment ? toFormValues(payment) : EMPTY,
	});
	const { reset, control } = methods;

	React.useEffect(() => {
		if (isOpen) reset(payment ? toFormValues(payment) : EMPTY);
	}, [isOpen, payment, reset]);

	const tutorials = useTutorialOptions(isOpen);
	const tutorialOptions = (tutorials.data?.items ?? []).map((t) => ({
		value: t.id,
		label: t.name,
	}));

	const save = useSavePaymentMutation(payment?.id, { onSuccess: onClose });

	const onSubmit: SubmitHandler<PaymentFormValues> = (data) =>
		save.mutate({
			tutorial_id: data.tutorial_id,
			nominal: Number(data.nominal),
			is_paid: data.is_paid,
			// A paid payment without a date counts from today.
			payment_date: dateToUnix(
				data.payment_date || (data.is_paid ? todayISO() : ""),
			),
			note: data.note.trim(),
		});

	return (
		<Dialog
			open={isOpen}
			onClose={save.isPending ? undefined : onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ fontWeight: 600 }}>
				{isEdit ? "Edit payment" : "Add payment"}
			</DialogTitle>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
					<DialogContent
						sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
					>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Tutorial
							</LabelText>
							<SelectInput
								id="tutorial_id"
								label={null}
								placeholder="Choose a tutorial"
								isClearable={false}
								options={tutorialOptions}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Amount
								</LabelText>
								<Controller
									name="nominal"
									control={control}
									render={({ field, fieldState }) => (
										<TextField
											value={
												field.value ? formatNumber(Number(field.value)) : ""
											}
											onChange={(e) =>
												// keep digits only; the dots are added for display
												field.onChange(
													e.target.value.replace(/\D/g, "").replace(/^0+/, ""),
												)
											}
											onBlur={field.onBlur}
											inputRef={field.ref}
											placeholder="150.000"
											autoComplete="off"
											fullWidth
											error={Boolean(fieldState.error)}
											helperText={fieldState.error?.message}
											slotProps={{
												htmlInput: { inputMode: "numeric" },
												input: {
													startAdornment: (
														<InputAdornment position="start">Rp</InputAdornment>
													),
												},
											}}
										/>
									)}
								/>
							</div>
							<div>
								<LabelText labelTextClasname="mb-1.5 font-semibold">
									Payment date
								</LabelText>
								<Input id="payment_date" type="date" />
							</div>
						</div>

						<SwitchInput
							id="is_paid"
							label="Paid"
							helperText="Only paid payments count as income."
						/>

						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Note
							</LabelText>
							<TextArea
								id="note"
								rows={2}
								maxLength={100}
								placeholder="Optional"
							/>
						</div>
					</DialogContent>

					<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={save.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" variant="brand" isLoading={save.isPending}>
							{isEdit ? "Save changes" : "Add payment"}
						</Button>
					</DialogActions>
				</form>
			</FormProvider>
		</Dialog>
	);
}
