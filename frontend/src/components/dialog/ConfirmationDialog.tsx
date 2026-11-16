import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@/components/button/Button";

export default function ConfirmationDialog({
	isOpen,
	setIsOpen,
	message,
	onConfirm,
	confirmLabel = "Ya",
	cancelLabel = "Tidak",
	confirmVariant = "brand",
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	message: string;
	onConfirm: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "brand" | "red";
}) {
	return (
		<Dialog
			open={isOpen}
			onClose={() => setIsOpen(false)}
			maxWidth="xs"
			fullWidth
		>
			<IconButton
				aria-label="Close"
				onClick={() => setIsOpen(false)}
				sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
			>
				<CloseIcon fontSize="small" />
			</IconButton>

			<DialogContent sx={{ pt: 5 }}>
				<Stack spacing={2} sx={{ alignItems: "center" }}>
					<WarningAmberIcon sx={{ fontSize: 50, color: "#ffbf00" }} />
					<Typography align="center" sx={{ fontWeight: 500, fontSize: 18 }}>
						{message}
					</Typography>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
				<Button onClick={() => setIsOpen(false)} variant="outline">
					{cancelLabel}
				</Button>
				<Button
					onClick={() => {
						onConfirm();
						setIsOpen(false);
					}}
					variant={confirmVariant}
				>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
