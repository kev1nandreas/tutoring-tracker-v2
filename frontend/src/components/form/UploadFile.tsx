"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import * as React from "react";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";
import {
	Controller,
	get,
	type RegisterOptions,
	useFormContext,
} from "react-hook-form";
import FilePreview from "@/components/form/FilePreview";
import { useUploadFileMutation } from "@/hooks/useUploadFileMutation";
import type { FileWithPreview } from "@/types/dropzone";

export type UploadFileProps = {
	id: string;
	label?: string;
	helperText?: string;
	hideError?: boolean;
	required?: boolean;
	validation?: RegisterOptions;
	accept?: Accept;
	maxFiles?: number;
	disabled?: boolean;
	maxSize?: number;
	className?: string;
	uploadToApi?: boolean;
	onFileUpload?: (files: FileWithPreview[]) => void;
};

export default function UploadFile({
	id,
	label,
	helperText,
	hideError = false,
	required,
	validation,
	accept = {
		"image/*": [".jpg", ".jpeg", ".png"],
		"application/pdf": [".pdf"],
	},
	maxFiles = 1,
	maxSize = 600 * 1024,
	className,
	disabled = false,
	uploadToApi = false,
	onFileUpload,
}: UploadFileProps) {
	const {
		control,
		setValue,
		setError,
		clearErrors,
		formState: { errors },
	} = useFormContext();

	const error = get(errors, id);

	const dropzoneRef = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (error) {
			dropzoneRef.current?.focus();
		}
	}, [error]);

	const [files, setFiles] = React.useState<FileWithPreview[]>([]);

	const uploadMutation = useUploadFileMutation(id, label);
	const uploadFile = uploadMutation.mutate;
	const isPending = uploadToApi ? uploadMutation.isPending : false;

	React.useEffect(() => {
		if (!uploadToApi) return;

		const storageKey = `file_${id}`;
		const storedFileData = sessionStorage.getItem(storageKey);

		if (storedFileData) {
			try {
				const fileData = JSON.parse(storedFileData);

				const displayFile = {
					name: fileData.name,
					size: fileData.size,
					type: fileData.type,
					preview: fileData.preview,
				} as FileWithPreview;

				setFiles([displayFile]);
				setValue(id, [displayFile]);
			} catch (_error) {
				sessionStorage.removeItem(storageKey);
			}
		}
	}, [id, setValue, uploadToApi]);

	const onDrop = React.useCallback(
		<T extends File>(acceptedFiles: T[], rejectedFiles: FileRejection[]) => {
			if (rejectedFiles.length > 0) {
				setError(id, {
					type: "manual",
					message:
						rejectedFiles[0].errors[0].code === "file-too-large"
							? `File cannot exceed ${maxSize / 1024} KB`
							: "Unsupported file type",
				});
				return;
			}

			const acceptedFilesPreview = acceptedFiles.map((file: T) =>
				Object.assign(file, { preview: URL.createObjectURL(file) }),
			);

			setFiles(acceptedFilesPreview.slice(0, maxFiles));
			setValue(id, acceptedFilesPreview.slice(0, maxFiles));
			clearErrors(id);

			if (uploadToApi && acceptedFiles.length > 0) {
				uploadFile(acceptedFiles[0]);
			}

			if (onFileUpload) {
				onFileUpload(
					acceptedFilesPreview.slice(0, maxFiles) as FileWithPreview[],
				);
			}
		},
		[
			clearErrors,
			id,
			maxFiles,
			maxSize,
			setError,
			setValue,
			uploadFile,
			uploadToApi,
			onFileUpload,
		],
	);

	const onDelete = (index: number) => {
		const fileToDelete = files[index];

		if (uploadToApi) {
			const storageKey = `file_${id}`;
			sessionStorage.removeItem(storageKey);
		}

		URL.revokeObjectURL(fileToDelete.preview);

		const updatedFiles = files.filter((_, i) => i !== index);
		setFiles(updatedFiles);
		setValue(id, updatedFiles);
	};

	React.useEffect(() => {
		return () => {
			files.forEach((file) => URL.revokeObjectURL(file.preview));
		};
	}, [files]);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept,
		maxFiles,
		maxSize,
		disabled,
	});

	return (
		<Box sx={{ width: "100%" }} data-cy={`upload-${id}`}>
			{label && (
				<FormLabel
					required={required ?? !!validation?.required}
					sx={{ mb: 0.5, display: "block" }}
				>
					{label}
				</FormLabel>
			)}

			{files.length < maxFiles && (
				<Controller
					control={control}
					name={id}
					rules={validation}
					render={({ field: { onChange } }) => (
						<Box
							ref={dropzoneRef}
							{...getRootProps()}
							tabIndex={0}
							sx={{
								cursor: disabled ? "not-allowed" : "pointer",
								opacity: disabled ? 0.5 : 1,
								borderRadius: 2,
								border: "1px solid",
								borderColor: error ? "error.main" : "grey.300",
								bgcolor: error ? alpha("#EF4444", 0.05) : "background.paper",
								px: 4,
								py: 3,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 1,
								transition: "box-shadow 200ms",
								"&:hover": {
									boxShadow: disabled
										? "none"
										: (theme) =>
												`inset 0 0 0 1px ${theme.palette.primary.main}`,
								},
								"&:focus-visible": {
									outline: "none",
									boxShadow: (theme) =>
										`inset 0 0 0 1px ${theme.palette.primary.main}`,
								},
							}}
							className={className}
						>
							<input
								{...getInputProps({
									onChange: (e) => {
										onChange(e.target.files);
									},
								})}
								data-cy={`upload-${id}-input`}
							/>
							<CloudUploadIcon color={error ? "error" : "action"} />
							<Box
								component="p"
								sx={{
									fontWeight: 600,
									fontSize: 14,
									textAlign: "center",
									m: 0,
								}}
							>
								Unggah Berkas
							</Box>
						</Box>
					)}
				/>
			)}

			{files.length > 0 && (
				<Stack spacing={1} sx={{ mt: files.length && label ? 1 : 0 }}>
					{files.map((file, index) => (
						<FilePreview
							key={file.name}
							file={file}
							isLoading={uploadToApi ? isPending : false}
							deleteFile={() => onDelete(index)}
						/>
					))}
				</Stack>
			)}

			{!hideError && error && (
				<FormHelperText error sx={{ mx: 0 }}>
					{error.message?.toString()}
				</FormHelperText>
			)}
			{!error && helperText && files.length <= 0 && (
				<FormHelperText sx={{ mx: 0 }}>{helperText}</FormHelperText>
			)}
		</Box>
	);
}
