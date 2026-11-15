import Link from "next/link";

export interface Breadcrumb {
	redirect: string;
	name: string;
	isClickable: boolean;
}

interface BreadCrumbsProps {
	breadcrumbs: Breadcrumb[];
}

export default function BreadCrumbs({ breadcrumbs }: BreadCrumbsProps) {
	return (
		<ol className="flex items-center whitespace-nowrap text-sm">
			{breadcrumbs.map((breadcrumb, index) => {
				const isLast = index === breadcrumbs.length - 1;

				return (
					<li key={breadcrumb.redirect} className="inline-flex items-center">
						{breadcrumb.isClickable ? (
							<Link
								className={
									isLast
										? "flex items-center text-primary-active font-medium hover:text-primary-hover"
										: "flex items-center text-gray-500 hover:text-primary-hover focus:outline-none focus:text-primary-focus"
								}
								href={breadcrumb.redirect}
							>
								{breadcrumb.name}
							</Link>
						) : (
							<span
								className={
									isLast
										? "flex items-center text-primary-active font-medium"
										: "flex items-center text-gray-500"
								}
							>
								{breadcrumb.name}
							</span>
						)}
						{!isLast && (
							<svg
								className="shrink-0 size-5 text-gray-400 mx-1"
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path d="M6 13L10 3" stroke="currentColor"></path>
							</svg>
						)}
					</li>
				);
			})}
		</ol>
	);
}
