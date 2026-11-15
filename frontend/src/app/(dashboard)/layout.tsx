"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import DashboardLayout from "@/layouts/DashboardLayout";

function DashboardRootLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<DashboardLayout>{children}</DashboardLayout>
		</SidebarProvider>
	);
}

export default DashboardRootLayout;
