"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type * as React from "react";
import {
	Controller,
	get,
	type RegisterOptions,
	useFormContext,
} from "react-hook-form";

export type SelectOption = { value: string | number; label: string };

export type SelectInputProps = {
	label: string | null;
	id: string;
	placeholder?: string;
	helperText?: string;
	isMulti?: boolean;
	isSearchable?: boolean;
	isClearable?: boolean;
	readOnly?: boolean;
	disabled?: boolean;
	hideError?: boolean;
	required?: boolean;
	validation?: RegisterOptions;
	options: SelectOption[];
	className?: string;
	containerClassName?: string;
	"data-cy"?: string;
} & Pick<TextFieldProps, "sx">;

export default function SelectInput({
	disabled,
	readOnly,
	label,
	helperText,
	id,
	isMulti = false,
	isSearchable = true,
	isClearable = true,
	required,
	validation,
	options,
	hideError = false,
	className,
	containerClassName,
	sx,
	"data-cy": dataCy,
}: SelectInputProps) {
	const {
		control,
		formState: { errors },
	} = useFormContext();
	const error = get(errors, id);
	const isDisabled = disabled || readOnly;
	const isRequired = required ?? !!validation?.required;

	return (
		<div className={containerClassName} data-cy={dataCy}>
			<Controller
				name={id}
				control={control}
				rules={validation}
				render={({ field }) => {
					if (isSearchable && isMulti) {
						const selectedValue = options.filter((opt) =>
							((field.value as (string | number)[]) ?? []).includes(opt.value),
						);

						return (
							<Autocomplete
								multiple
								className={className}
								sx={sx}
								disabled={isDisabled}
								disableClearable={!isClearable}
								options={options}
								getOptionLabel={(opt) => opt.label}
								isOptionEqualToValue={(opt, val) => opt.value === val.value}
								value={selectedValue}
								onChange={(_, newValue) => {
									field.onChange(newValue.map((opt) => opt.value));
								}}
								onBlur={field.onBlur}
								renderValue={(value, getItemProps) =>
									value.map((option, index) => {
										const { key, ...itemProps } = getItemProps({ index });
										return (
											<Chip
												key={key}
												label={option.label}
												size="small"
												{...itemProps}
											/>
										);
									})
								}
								renderInput={(params) => (
									<TextField
										{...params}
										label={label ?? undefined}
										required={isRequired}
										error={!hideError && !!error}
										helperText={
											(!hideError && error?.message?.toString()) ||
											helperText ||
											undefined
										}
									/>
								)}
							/>
						);
					}

					if (isSearchable) {
						const selectedValue =
							options.find((opt) => opt.value === field.value) ?? null;

						return (
							<Autocomplete
								className={className}
								sx={sx}
								disabled={isDisabled}
								disableClearable={!isClearable}
								options={options}
								getOptionLabel={(opt) => opt.label}
								isOptionEqualToValue={(opt, val) => opt.value === val.value}
								value={selectedValue}
								onChange={(_, newValue) => {
									field.onChange(newValue?.value ?? "");
								}}
								onBlur={field.onBlur}
								renderInput={(params) => (
									<TextField
										{...params}
										label={label ?? undefined}
										required={isRequired}
										error={!hideError && !!error}
										helperText={
											(!hideError && error?.message?.toString()) ||
											helperText ||
											undefined
										}
									/>
								)}
							/>
						);
					}

					return (
						<TextField
							select
							className={className}
							sx={sx}
							label={label ?? undefined}
							required={isRequired}
							disabled={isDisabled}
							value={isMulti ? (field.value ?? []) : (field.value ?? "")}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								field.onChange(event.target.value);
							}}
							onBlur={field.onBlur}
							error={!hideError && !!error}
							helperText={
								(!hideError && error?.message?.toString()) ||
								helperText ||
								undefined
							}
							slotProps={{
								select: {
									multiple: isMulti,
									renderValue: isMulti
										? (selected) =>
												options
													.filter((opt) =>
														(selected as (string | number)[]).includes(
															opt.value,
														),
													)
													.map((opt) => opt.label)
													.join(", ")
										: undefined,
								},
							}}
						>
							{options.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</TextField>
					);
				}}
			/>
		</div>
	);
}
