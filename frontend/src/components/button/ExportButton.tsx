import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as React from "react";
import Button from "@/components/button/Button";
import { useExportMutation } from "@/hooks/useExportMutation";

const FORMAT_OPTIONS = [
	{ value: "xlsx", label: "Excel", icon: FileSpreadsheet },
	{ value: "csv", label: "CSV", icon: FileText },
] as const;

type ExportFormat = (typeof FORMAT_OPTIONS)[number]["value"];

type ExportButtonProps = {
	endpoint: string;
	filename: string;
	/** Current page filters; pagination is left out on purpose. */
	params?: Record<string, unknown>;
};

export default function ExportButton({
	endpoint,
	filename,
	params,
}: ExportButtonProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [format, setFormat] = React.useState<ExportFormat>("xlsx");
	const exportMutation = useExportMutation({ endpoint, filename });

	const handleExport = (nextFormat: ExportFormat) => {
		setFormat(nextFormat);
		exportMutation.mutate(
			{ ...params, format: nextFormat },
			{ onSuccess: () => setIsOpen(false) },
		);
	};

	return (
		<>
			<Button
				variant="outline"
				leftIcon={Download}
				onClick={() => setIsOpen(true)}
			>
				Export
			</Button>

			<Dialog
				open={isOpen}
				onClose={() => !exportMutation.isPending && setIsOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 0 }}>
					Export Data
				</DialogTitle>
				<IconButton
					aria-label="Close"
					onClick={() => setIsOpen(false)}
					disabled={exportMutation.isPending}
					sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>

				<DialogContent>
					<p className="mb-4 text-sm text-gray-500">Pilih format file:</p>
					<div className="grid grid-cols-2 gap-3">
						{FORMAT_OPTIONS.map((option) => (
							<Button
								key={option.value}
								variant="outline"
								leftIcon={option.icon}
								isLoading={exportMutation.isPending && format === option.value}
								disabled={exportMutation.isPending}
								onClick={() => handleExport(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
