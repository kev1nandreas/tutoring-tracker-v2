"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import Button from "@/components/button/Button";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import Input from "@/components/form/Input";
import SelectInput from "@/components/form/SelectInput";
import TextArea from "@/components/form/TextArea";
import UploadFile from "@/components/form/UploadFile";
import api from "@/lib/api";
import type { ApiError, ApiResponse } from "@/types/api";

const sandboxFormSchema = z.object({
	username: z.string().min(1, "Username wajib diisi!"),
	readonlyExample: z.string().optional(),
	notes: z
		.string()
		.max(1000, "Maksimum 1000 karakter")
		.optional()
		.or(z.literal("")),
	sandbox1: z.string().min(1, "SelectInput wajib diisi!"),
	sandbox2: z.string().optional(),
	image: z.array(z.instanceof(File)).min(1, "This field is required"),
});

type SandboxForm = z.infer<typeof sandboxFormSchema>;

type FileUploadResponse = {
	url: string;
	fileName: string;
};

export default function FormSandbox() {
	const methods = useForm<SandboxForm>({
		resolver: zodResolver(sandboxFormSchema),
		defaultValues: {
			username: "",
			readonlyExample: "This field is read only",
			notes: "",
			sandbox1: "",
			sandbox2: "",
			image: [],
		},
	});
	const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

	const { handleSubmit } = methods;

	const { mutate: handleImageUpload } = useMutation<
		ApiResponse<FileUploadResponse>,
		ApiError,
		globalThis.FormData
	>({
		mutationFn: async (data) => {
			const res = await api.post("/users/file", data, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			toast.success("File uploaded!");
			return res.data;
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onSubmit: SubmitHandler<SandboxForm> = (data) => {
		const formData = new FormData();

		if (data.image?.[0]) {
			formData.append("file", data.image[0]);
		}

		handleImageUpload(formData);
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-white">
			<div className="flex flex-col">
				<FormProvider {...methods}>
					<form className="w-150" onSubmit={handleSubmit(onSubmit)}>
						<Stack spacing={2.5}>
							<Input
								id="username"
								label="Username Tujuan"
								placeholder="Username"
								required
							/>
							<Input
								id="readonlyExample"
								label="Username Tujuan (Read Only)"
								placeholder="Username"
								readOnly
							/>
							<SelectInput
								id="sandbox1"
								label="Required SelectInput"
								options={options}
								placeholder="Pilih opsi"
								isSearchable={false}
								required
							/>
							<SelectInput
								id="sandbox2"
								label="Searchable SelectInput"
								options={options}
								placeholder="Pilih opsi"
							/>
							<TextArea
								id="notes"
								label="Notes"
								placeholder="Write some notes..."
								helperText="Optional, max 1000 characters"
								rows={4}
							/>
							<UploadFile
								label="Upload File"
								id="image"
								maxSize={2000000}
								accept={{
									"image/*": [".jpg", ".jpeg", ".png"],
									"application/pdf": [".pdf"],
								}}
								maxFiles={1}
								helperText="Format file .jpeg .jpg .png .pdf, maksimum 2 MB"
								required
							/>
							<Stack direction="row" spacing={1.5}>
								<Button type="submit">Submit</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsConfirmOpen(true)}
								>
									Open Confirmation Dialog
								</Button>
							</Stack>
						</Stack>
					</form>
				</FormProvider>

				<ConfirmationDialog
					isOpen={isConfirmOpen}
					setIsOpen={setIsConfirmOpen}
					message="Are you sure you want to continue?"
					onConfirm={() => toast.success("Confirmed!")}
				/>
			</div>
		</main>
	);
}

const options = [
	{ value: "1", label: "Satu" },
	{ value: "2", label: "Dua" },
	{ value: "3", label: "Tiga" },
	{ value: "4", label: "Empat" },
	{ value: "5", label: "Lima" },
];
