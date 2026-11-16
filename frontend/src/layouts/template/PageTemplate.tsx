import BreadCrumbs, { type Breadcrumb } from "@/components/BreadCrumbs";
import Typography from "@/components/Typography";

interface PageTemplateProps {
	children: React.ReactNode;
	/** Omit when the page body renders its own heading. */
	title?: string;
	description?: string;
	breadcrumbs: Breadcrumb[];
	/** Right-aligned header content, e.g. an "Add" button. */
	action?: React.ReactNode;
}

export default function PageTemplate({
	children,
	title,
	description,
	breadcrumbs,
	action,
}: PageTemplateProps) {
	return (
		<div className="flex flex-col gap-3">
			<BreadCrumbs breadcrumbs={breadcrumbs} />

			{(title || action) && (
				<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						{title && (
							<Typography
								as="h1"
								weight="semibold"
								className="text-2xl break-words text-gray-900"
							>
								{title}
							</Typography>
						)}
						{description && (
							<Typography as="p" className="text-sm text-gray-500">
								{description}
							</Typography>
						)}
					</div>
					{action}
				</div>
			)}

			{children}
		</div>
	);
}
