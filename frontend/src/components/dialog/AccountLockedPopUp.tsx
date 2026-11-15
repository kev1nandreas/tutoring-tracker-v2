"use client";

import CloseIcon from "@mui/icons-material/Close";
import LockClockIcon from "@mui/icons-material/LockClock";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as React from "react";
import Button from "@/components/button/Button";

function getRemainingMs(lockedUntil: string | Date) {
	const target =
		lockedUntil instanceof Date
			? lockedUntil.getTime()
			: new Date(lockedUntil).getTime();
	return Math.max(0, target - Date.now());
}

function formatCountdown(ms: number) {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AccountLockedPopUp({
	isOpen,
	setIsOpen,
	lockedUntil,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	lockedUntil: string | Date | null;
}) {
	const [remainingMs, setRemainingMs] = React.useState(0);

	React.useEffect(() => {
		if (!isOpen || !lockedUntil) return;

		setRemainingMs(getRemainingMs(lockedUntil));
		const interval = setInterval(() => {
			setRemainingMs(getRemainingMs(lockedUntil));
		}, 1000);

		return () => clearInterval(interval);
	}, [isOpen, lockedUntil]);

	if (!lockedUntil) return null;

	const isExpired = remainingMs <= 0;
	const unlockTimeLabel = new Date(lockedUntil).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

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
					<LockClockIcon sx={{ fontSize: 50, color: "#dc2626" }} />

					<Typography align="center" sx={{ fontWeight: 600, fontSize: 18 }}>
						Account Locked
					</Typography>

					<Typography
						align="center"
						sx={{ color: "text.secondary", fontSize: 14 }}
					>
						Too many failed login attempts. Your account has been temporarily
						locked for security reasons.
					</Typography>

					{!isExpired ? (
						<Stack spacing={0.5} sx={{ alignItems: "center", pt: 1 }}>
							<Typography
								sx={{
									fontFamily: "monospace",
									fontSize: 32,
									fontWeight: 700,
									color: "#dc2626",
									letterSpacing: 1,
								}}
							>
								{formatCountdown(remainingMs)}
							</Typography>
							<Typography
								align="center"
								sx={{ color: "text.secondary", fontSize: 13 }}
							>
								Try again after {unlockTimeLabel}
							</Typography>
						</Stack>
					) : (
						<Typography
							align="center"
							sx={{
								color: "success.main",
								fontWeight: 600,
								fontSize: 14,
								pt: 1,
							}}
						>
							You can try signing in again now.
						</Typography>
					)}
				</Stack>
			</DialogContent>

			<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
				<Button onClick={() => setIsOpen(false)} variant="brand">
					{isExpired ? "Try Again" : "Close"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
