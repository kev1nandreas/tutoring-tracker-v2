import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { Eye, EyeOff, type LucideProps } from "lucide-react";
import * as React from "react";
import { get, type RegisterOptions, useFormContext } from "react-hook-form";

type LucideIconType = React.ComponentType<LucideProps>;

export type InputProps = {
	id: string;
	label?: string;
	helperText?: React.ReactNode;
	hideError?: boolean;
	required?: boolean;
	validation?: RegisterOptions;
	prefix?: string;
	suffix?: string;
	rightIcon?: LucideIconType;
	leftIcon?: LucideIconType;
	rightIconClassName?: string;
	leftIconClassName?: string;
	className?: string;
	containerClassName?: string;
	type?: React.HTMLInputTypeAttribute;
	placeholder?: string;
	readOnly?: boolean;
	disabled?: boolean;
	autoFocus?: boolean;
	defaultValue?: string | number;
	autoComplete?: string;
	min?: number | string;
	max?: number | string;
	step?: number | string;
	"data-cy"?: string;
} & Pick<TextFieldProps, "size" | "variant" | "sx">;

export default function Input({
	id,
	label,
	helperText,
	hideError = false,
	required,
	validation,
	prefix,
	suffix,
	className,
	containerClassName,
	type = "text",
	readOnly = false,
	disabled = false,
	rightIcon: RightIcon,
	leftIcon: LeftIcon,
	rightIconClassName,
	leftIconClassName,
	size = "small",
	variant = "outlined",
	min,
	max,
	step,
	"data-cy": dataCy,
	...rest
}: InputProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext();

	const [showPassword, setShowPassword] = React.useState(false);
	const error = get(errors, id);

	const isPassword = type === "password";
	let resolvedType = type;
	if (isPassword) resolvedType = showPassword ? "text" : "password";

	const { ref: inputRef, ...registered } = register(id, validation);

	return (
		<TextField
			{...registered}
			{...rest}
			inputRef={inputRef}
			id={id}
			name={id}
			label={label}
			required={required ?? !!validation?.required}
			type={resolvedType}
			size={size}
			variant={variant}
			fullWidth
			className={containerClassName}
			disabled={readOnly || disabled}
			error={!hideError && !!error}
			helperText={
				(!hideError && error?.message?.toString()) || helperText || undefined
			}
			data-cy={dataCy}
			slotProps={{
				htmlInput: { min, max, step },
				input: {
					className,
					readOnly,
					startAdornment: prefix ? (
						<InputAdornment position="start">{prefix}</InputAdornment>
					) : (
						LeftIcon && (
							<InputAdornment position="start">
								<LeftIcon size={18} className={leftIconClassName} />
							</InputAdornment>
						)
					),
					endAdornment:
						suffix || isPassword || RightIcon ? (
							<InputAdornment position="end">
								{suffix}
								{isPassword && (
									<IconButton
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
										onClick={() => setShowPassword((prev) => !prev)}
										edge="end"
										size="small"
									>
										{showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
									</IconButton>
								)}
								{!isPassword && RightIcon && (
									<RightIcon size={18} className={rightIconClassName} />
								)}
							</InputAdornment>
						) : undefined,
				},
			}}
		/>
	);
}
