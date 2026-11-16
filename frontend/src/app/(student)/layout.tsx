"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import withAuth from "@/components/hoc/withAuth";
import Typography from "@/components/Typography";
import { PATH } from "@/shared/path";

function StudentLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const user = useAuthStore.useUser();
	const logout = useAuthStore.useLogout();

	const handleLogout = () => {
		logout();
		router.replace(PATH.LOGIN);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
				<Typography weight="bold" className="text-lg">
					Tutoring Tracker
				</Typography>
				<div className="flex items-center gap-3">
					<Typography className="text-sm text-gray-600">
						{user?.name}
					</Typography>
					<Button
						variant="outline"
						size="sm"
						onClick={handleLogout}
						leftIcon={LogOut}
					>
						Logout
					</Button>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6 md:px-6">{children}</main>
		</div>
	);
}

const GuardedStudentLayout = withAuth(StudentLayout, { roles: ["student"] });

export default function StudentRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <GuardedStudentLayout>{children}</GuardedStudentLayout>;
}
