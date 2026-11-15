import type { Metadata } from "next";
import PageTemplate from "@/layouts/template/PageTemplate";
import { PATH } from "@/shared/path";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "Dashboard overview",
};

export default function DashboardPage() {
	return (
		<PageTemplate
			title="Dashboard"
			description="Start building your pages here."
			breadcrumbs={[
				{ name: "Dashboard", redirect: PATH.DASHBOARD, isClickable: false },
			]}
		>
			<div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
				Empty dashboard page. Add your own content.
			</div>
		</PageTemplate>
	);
}
