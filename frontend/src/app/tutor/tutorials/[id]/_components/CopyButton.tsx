"use client";

import { Check, Copy, type LucideIcon } from "lucide-react";
import * as React from "react";
import toast from "react-hot-toast";
import Button from "@/components/button/Button";

type Props = {
	/** Builds the text at click time, so it can use window.location.origin. */
	getText: () => string;
	label: string;
	successMessage: string;
	icon?: LucideIcon;
};

/** Small outline button that copies a text to the clipboard. */
export default function CopyButton({
	getText,
	label,
	successMessage,
	icon: Icon = Copy,
}: Props) {
	const [copied, setCopied] = React.useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(getText());
			setCopied(true);
			toast.success(successMessage);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Could not copy. Copy it manually.");
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			leftIcon={copied ? Check : Icon}
			onClick={copy}
		>
			{label}
		</Button>
	);
}
