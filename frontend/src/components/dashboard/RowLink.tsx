import Link from "next/link";
import clsxm from "@/lib/clsxm";

/**
 * Makes a whole dashboard row clickable. Without href the content renders as is.
 * The negative margin lets the hover background reach the card edges.
 */
export default function RowLink({
	href,
	label,
	className,
	children,
}: {
	href?: string;
	/** Accessible name when the row's text alone is not clear enough. */
	label?: string;
	className?: string;
	children: React.ReactNode;
}) {
	if (!href) return <div className={className}>{children}</div>;
	return (
		<Link
			href={href}
			aria-label={label}
			className={clsxm(
				"-mx-2 block cursor-pointer rounded-lg px-2 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600",
				className,
			)}
		>
			{children}
		</Link>
	);
}
