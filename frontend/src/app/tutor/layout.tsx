"use client";

import withAuth from "@/components/hoc/withAuth";
import { SidebarProvider } from "@/context/SidebarContext";
import DashboardLayout from "@/layouts/DashboardLayout";

function TutorLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<DashboardLayout>{children}</DashboardLayout>
		</SidebarProvider>
	);
}

const GuardedTutorLayout = withAuth(TutorLayout, { roles: ["tutor", "admin"] });

export default function TutorRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <GuardedTutorLayout>{children}</GuardedTutorLayout>;
}
