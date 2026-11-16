import MuiButton, {
	type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

const ButtonVariant = [
	"primary",
	"brand",
	"blue",
	"green",
	"yellow",
	"red",
	"outline",
	"ghost",
] as const;
const ButtonSize = ["sm", "base", "lg"] as const;

export type ButtonProps = {
	isLoading?: boolean;
	variant?: (typeof ButtonVariant)[number];
	size?: (typeof ButtonSize)[number];
	leftIcon?: LucideIcon;
	rightIcon?: LucideIcon;
	leftIconClassName?: string;
	rightIconClassName?: string;
} & Omit<React.ComponentPropsWithRef<"button">, "color">;

const sizeMap: Record<(typeof ButtonSize)[number], MuiButtonProps["size"]> = {
	sm: "small",
	base: "medium",
	lg: "large",
};

// Variants that map cleanly onto MUI's color palette
const colorVariants = ["blue", "green", "yellow", "red"] as const;
const colorMap: Record<
	(typeof colorVariants)[number],
	"info" | "success" | "warning" | "error"
> = {
	blue: "info",
	green: "success",
	yellow: "warning",
	red: "error",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			disabled: buttonDisabled,
			isLoading,
			variant = "primary",
			size = "base",
			leftIcon: LeftIcon,
			rightIcon: RightIcon,
			leftIconClassName,
			rightIconClassName,
			style,
			...rest
		},
		ref,
	) => {
		const disabled = isLoading || buttonDisabled;

		let muiVariant: MuiButtonProps["variant"] = "contained";
		if (variant === "outline") muiVariant = "outlined";
		else if (variant === "ghost") muiVariant = "text";

		let muiColor: MuiButtonProps["color"] = "primary";
		if (variant === "outline" || variant === "ghost") muiColor = "inherit";
		else if (variant !== "primary" && variant !== "brand")
			muiColor = colorMap[variant as (typeof colorVariants)[number]];

		return (
			<MuiButton
				ref={ref}
				type="button"
				disabled={disabled}
				variant={muiVariant}
				color={muiColor}
				size={sizeMap[size]}
				className={className}
				startIcon={
					!isLoading && LeftIcon ? (
						<LeftIcon size="1em" className={leftIconClassName} />
					) : undefined
				}
				endIcon={
					!isLoading && RightIcon ? (
						<RightIcon size="1em" className={rightIconClassName} />
					) : undefined
				}
				sx={{
					cursor: "pointer",
					...(variant === "brand" && {
						backgroundColor: "brand.700",
						"&:hover": { backgroundColor: "brand.800" },
					}),
					...(variant === "outline" && {
						color: "text.primary",
						// solid, so it stays legible over graph paper and artwork
						backgroundColor: "common.white",
						borderColor: "grey.300",
						"&:hover": {
							backgroundColor: "grey.200",
							borderColor: "grey.300",
						},
					}),
					...(variant === "ghost" && {
						color: "text.secondary",
						"&:hover": {
							backgroundColor: alpha("#000", 0.04),
						},
					}),
					...(isLoading && {
						color: "transparent !important",
					}),
				}}
				style={style}
				{...rest}
			>
				{isLoading && (
					<CircularProgress
						size={18}
						thickness={5}
						sx={{
							position: "absolute",
							color:
								variant === "outline" || variant === "ghost"
									? "text.primary"
									: "common.white",
						}}
					/>
				)}
				{children}
			</MuiButton>
		);
	},
);
Button.displayName = "Button";

export default Button;
