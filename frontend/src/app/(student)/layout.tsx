"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import withAuth from "@/components/hoc/withAuth";
import NotificationBell from "@/components/notification/NotificationBell";
import Typography from "@/components/Typography";
import clsxm from "@/lib/clsxm";
import { PATH } from "@/shared/path";

const NAV = [
	{ label: "Home", href: PATH.STUDENT_HOME },
	{ label: "My tutorials", href: PATH.STUDENT_TUTORIALS },
	{ label: "Join a class", href: PATH.ENROLL },
];

function StudentLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const user = useAuthStore.useUser();
	const logout = useAuthStore.useLogout();

	// A Google sign-up must first give the details Google does not provide.
	const needsProfile = user?.profile_complete === false;
	React.useEffect(() => {
		if (needsProfile) router.replace(PATH.COMPLETE_PROFILE);
	}, [needsProfile, router]);

	const handleLogout = () => {
		logout();
		router.replace(PATH.LOGIN);
	};

	if (needsProfile) return null;

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
				<div className="flex items-center gap-6">
					<Typography weight="bold" className="text-lg">
						Tutoring Tracker
					</Typography>
					<nav aria-label="Main" className="flex gap-1">
						{NAV.map(({ label, href }) => {
							const active =
								href === PATH.STUDENT_HOME
									? pathname === href
									: pathname.startsWith(href);
							return (
								<Link
									key={href}
									href={href}
									aria-current={active ? "page" : undefined}
									className={clsxm(
										"rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600",
										active
											? "bg-brand-50 text-brand-700"
											: "text-gray-600 hover:bg-gray-100",
									)}
								>
									{label}
								</Link>
							);
						})}
					</nav>
				</div>
				<div className="flex items-center gap-3">
					<NotificationBell />
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
