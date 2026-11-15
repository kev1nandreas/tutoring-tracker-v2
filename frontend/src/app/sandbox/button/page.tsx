import { ArrowRight, Plus, Settings, Trash2 } from "lucide-react";
import Button from "@/components/button/Button";
import IconButton from "@/components/button/IconButton";
import ButtonLink from "@/components/links/ButtonLink";
import IconLink from "@/components/links/IconLink";
import Typography from "@/components/Typography";

const buttonVariants = [
	{
		variant: "primary",
		label: "Primary",
	},
	{
		variant: "blue",
		label: "Blue",
	},
	{
		variant: "green",
		label: "Green",
	},
	{
		variant: "yellow",
		label: "Yellow",
	},
	{
		variant: "red",
		label: "Red",
	},
	{
		variant: "outline",
		label: "Outline",
	},
	{
		variant: "ghost",
		label: "Ghost",
	},
] as const;

const buttonSizes = ["lg", "md", "sm"] as const;
const buttonStates = ["", "disabled", "isLoading"] as const;

export default function ButtonPage() {
	return (
		<main className="min-h-screen items-center justify-center bg-white py-20">
			<section className="flex flex-col gap-8 px-24">
				{buttonVariants.map(({ variant, label }) => (
					<div key={variant}>
						<Typography as="h2">{label}</Typography>
						{buttonStates.map((state) => (
							<div
								key={state || "default"}
								className="mt-3 flex flex-wrap items-end gap-3"
							>
								{buttonSizes.map((size) => {
									if (variant === "ghost" && size === "lg") return null;

									return (
										<Button
											key={size}
											variant={variant}
											size={size === "md" ? undefined : size}
											leftIcon={Plus}
											rightIcon={ArrowRight}
											disabled={state === "disabled"}
											isLoading={state === "isLoading"}
										>
											{label}{" "}
											{state.charAt(0).toUpperCase() + state.slice(1) ||
												"Button"}
										</Button>
									);
								})}
							</div>
						))}
					</div>
				))}

				<div>
					<Typography as="h2">Button Link</Typography>
					{buttonVariants.map(({ variant, label }) => {
						if (variant === "red") return null;

						return (
							<div
								key={`${variant}-link`}
								className="mt-3 flex flex-wrap items-end gap-3"
							>
								{buttonSizes.map((size) => {
									if (variant === "ghost" && size === "lg") return null;

									return (
										<ButtonLink
											key={size}
											href="/"
											variant={variant}
											size={size === "md" ? undefined : size}
											leftIcon={Plus}
											rightIcon={ArrowRight}
										>
											{label} Button Link
										</ButtonLink>
									);
								})}
							</div>
						);
					})}
				</div>

				<div>
					<Typography as="h2">Icon Button</Typography>
					{buttonVariants.map(({ variant, label }) => (
						<div
							key={`${variant}-icon`}
							className="mt-3 flex flex-wrap items-end gap-3"
						>
							{(["xs", "sm", "base", "lg"] as const).map((size) => {
								if (variant === "ghost" && size === "lg") return null;

								return (
									<IconButton
										key={size}
										variant={variant}
										size={size}
										icon={Settings}
										aria-label={`${label} icon button`}
									/>
								);
							})}
							<IconButton
								variant={variant}
								icon={Trash2}
								isLoading
								aria-label={`${label} icon button loading`}
							/>
							<IconButton
								variant={variant}
								icon={Trash2}
								disabled
								aria-label={`${label} icon button disabled`}
							/>
						</div>
					))}
				</div>

				<div>
					<Typography as="h2">Icon Link</Typography>
					<div className="mt-3 flex flex-wrap items-end gap-3">
						{buttonVariants.map(({ variant, label }) => (
							<IconLink
								key={`${variant}-icon-link`}
								href="/"
								variant={variant}
								icon={Settings}
								aria-label={`${label} icon link`}
							/>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
