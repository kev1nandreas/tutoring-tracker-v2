"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { Controller, useFormContext } from "react-hook-form";

export type SwitchInputProps = {
	id: string;
	label: string;
	helperText?: string;
	disabled?: boolean;
};

/** Boolean field for react-hook-form: a labelled switch with optional hint text. */
export default function SwitchInput({
	id,
	label,
	helperText,
	disabled,
}: SwitchInputProps) {
	const { control } = useFormContext();

	return (
		<Controller
			name={id}
			control={control}
			render={({ field }) => (
				<div>
					<FormControlLabel
						label={label}
						disabled={disabled}
						sx={{
							m: 0,
							gap: 1,
							"& .MuiFormControlLabel-label": { fontWeight: 500, fontSize: 14 },
						}}
						control={
							<Switch
								id={id}
								checked={Boolean(field.value)}
								onChange={(e) => field.onChange(e.target.checked)}
								onBlur={field.onBlur}
								slotProps={{ input: { ref: field.ref } }}
							/>
						}
					/>
					{helperText && (
						<p className="ml-14 -mt-1 text-xs text-gray-500">{helperText}</p>
					)}
				</div>
			)}
		/>
	);
}
