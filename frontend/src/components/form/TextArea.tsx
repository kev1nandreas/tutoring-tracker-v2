import TextField, { type TextFieldProps } from "@mui/material/TextField";
import * as React from "react";
import { get, type RegisterOptions, useFormContext } from "react-hook-form";

export type TextAreaProps = {
	id: string;
	label?: string;
	helperText?: string;
	hideError?: boolean;
	required?: boolean;
	validation?: RegisterOptions;
	containerClassName?: string;
	className?: string;
	rows?: number;
	maxLength?: number;
	placeholder?: string;
	readOnly?: boolean;
	disabled?: boolean;
	autoFocus?: boolean;
	defaultValue?: string;
	"data-cy"?: string;
} & Pick<TextFieldProps, "size" | "variant" | "sx">;

export default function TextArea({
	id,
	label,
	helperText,
	hideError = false,
	required,
	validation,
	className,
	containerClassName,
	maxLength = 1000,
	readOnly = false,
	disabled = false,
	rows = 4,
	size = "small",
	variant = "outlined",
	placeholder,
	"data-cy": dataCy,
	...rest
}: TextAreaProps) {
	const [length, setLength] = React.useState(0);

	const {
		register,
		formState: { errors },
	} = useFormContext();

	const error = get(errors, id);
	const { ref: inputRef, onChange, ...registered } = register(id, validation);

	return (
		<TextField
			{...registered}
			{...rest}
			inputRef={inputRef}
			id={id}
			name={id}
			label={label}
			required={required ?? !!validation?.required}
			multiline
			rows={rows}
			size={size}
			variant={variant}
			fullWidth
			className={containerClassName}
			disabled={readOnly || disabled}
			placeholder={placeholder}
			error={!hideError && !!error}
			helperText={
				(!hideError && error?.message?.toString()) ||
				helperText ||
				`${length}/${maxLength}`
			}
			data-cy={dataCy}
			onChange={(e) => {
				onChange(e);
				setLength(e.target.value.length);
			}}
			slotProps={{
				htmlInput: {
					maxLength,
					className,
				},
			}}
		/>
	);
}
