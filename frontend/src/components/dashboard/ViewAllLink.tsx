import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** "View all" link for a dashboard card header. */
export default function ViewAllLink({
	href,
	children = "View all",
}: {
	href: string;
	children?: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
		>
			{children} <ArrowRight size={12} aria-hidden />
		</Link>
	);
}
