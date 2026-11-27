"use client";

import PasswordReminder from "@/components/settings/PasswordReminder";
import { useSidebar } from "@/context/SidebarContext";
import clsxm from "@/lib/clsxm";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
}

function DashboardLayout({ children, className }: LayoutProps) {
	const { isExpanded, isHovered, isMobileOpen } = useSidebar();

	const sidebarMargin =
		isExpanded || isHovered ? "lg:ml-[279px]" : "lg:ml-[88px]";
	const mainContentMargin = isMobileOpen ? "ml-0" : sidebarMargin;

	return (
		<div className="min-h-screen bg-gray-50 xl:flex">
			<AppSidebar />
			<Backdrop />
			<div
				className={clsxm(
					"min-w-0 flex-1 min-h-screen transition-all duration-300 ease-in-out",
					mainContentMargin,
				)}
			>
				<AppHeader />
				<div className={clsxm("mx-auto min-w-0 px-4 pt-6 md:px-6", className)}>
					<PasswordReminder />
					{children}
				</div>
			</div>
		</div>
	);
}

export default DashboardLayout;
