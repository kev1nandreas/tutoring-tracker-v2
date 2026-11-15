import BreadCrumbs, { type Breadcrumb } from "@/components/BreadCrumbs";
import Typography from "@/components/Typography";

interface PageTemplateProps {
	children: React.ReactNode;
	title: string;
	description?: string;
	breadcrumbs: Breadcrumb[];
}

export default function PageTemplate({
	children,
	title,
	description,
	breadcrumbs,
}: PageTemplateProps) {
	return (
		<div className="flex flex-col gap-3">
			<BreadCrumbs breadcrumbs={breadcrumbs} />

			<div className="mb-4">
				<Typography
					as="h1"
					weight="semibold"
					className="text-2xl text-gray-900"
				>
					{title}
				</Typography>
				{description && (
					<Typography as="p" className="text-sm text-gray-500">
						{description}
					</Typography>
				)}
			</div>

			{children}
		</div>
	);
}
