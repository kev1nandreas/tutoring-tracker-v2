import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import Avatar from "@mui/material/Avatar";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import * as React from "react";
import LightboxModal from "@/components/LightboxModal";
import type { FileWithPreview } from "@/types/dropzone";

type FilePreviewProps = {
	file: FileWithPreview;
	deleteFile?: (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		file: FileWithPreview,
	) => void;
	readOnly?: boolean;
	isLoading?: boolean;
};

export default function FilePreview({
	file,
	deleteFile,
	readOnly,
	isLoading,
}: FilePreviewProps) {
	const [isLightboxOpen, setIsLightboxOpen] = React.useState<boolean>(false);

	const handleDelete = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		deleteFile?.(e, file);
	};

	const fileSizeInMB = file.size / 1024 / 1024;

	const isImage = file.type.startsWith("image/");
	const canShowPreview = isImage && file.preview;

	return (
		<>
			<Paper
				variant="outlined"
				data-testid="file-preview"
				data-cy="file-preview"
				onClick={canShowPreview ? () => setIsLightboxOpen(true) : undefined}
				sx={{
					borderRadius: 2,
					cursor: canShowPreview ? "pointer" : "default",
				}}
			>
				<ListItem
					secondaryAction={
						!readOnly && (
							<IconButton edge="end" size="small" onClick={handleDelete}>
								<CloseIcon fontSize="small" />
							</IconButton>
						)
					}
				>
					{isLoading ? (
						<ListItemText primary="Mengunggah Data ..." />
					) : (
						<>
							<ListItemAvatar>
								{canShowPreview ? (
									<Avatar
										variant="rounded"
										src={file.preview}
										alt={file.name}
									/>
								) : (
									<Avatar variant="rounded">
										<InsertDriveFileIcon fontSize="small" />
									</Avatar>
								)}
							</ListItemAvatar>
							<ListItemText
								primary={
									file.name.length > 29
										? `${file.name.slice(0, 29)}...`
										: file.name
								}
								secondary={`${fileSizeInMB.toFixed(2)}mb`}
							/>
						</>
					)}
				</ListItem>
			</Paper>
			{canShowPreview && (
				<LightboxModal
					images={[file.preview]}
					open={isLightboxOpen}
					onClose={() => setIsLightboxOpen(false)}
				/>
			)}
			{!readOnly && (
				<FormHelperText sx={{ mx: 0 }}>
					File {file.name} berhasil diunggah
				</FormHelperText>
			)}
		</>
	);
}
