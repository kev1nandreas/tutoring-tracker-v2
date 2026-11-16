"use client";

import { LogOut, Menu, X } from "lucide-react";
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
	{ label: "Settings", href: PATH.SETTINGS },
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

	const [menuOpen, setMenuOpen] = React.useState(false);

	// close the mobile menu after every navigation
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
	React.useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	const handleLogout = () => {
		logout();
		router.replace(PATH.LOGIN);
	};

	const isActive = (href: string) =>
		href === PATH.STUDENT_HOME ? pathname === href : pathname.startsWith(href);

	if (needsProfile) return null;

	return (
		<div className="min-h-screen overflow-x-hidden bg-gray-50">
			<header className="relative z-40 border-b border-gray-200 bg-white">
				<div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
					<div className="flex min-w-0 items-center gap-6">
						<Typography weight="bold" className="truncate text-lg">
							Tutoring Tracker
						</Typography>
						<nav aria-label="Main" className="hidden gap-1 md:flex">
							{NAV.map(({ label, href }) => (
								<Link
									key={href}
									href={href}
									aria-current={isActive(href) ? "page" : undefined}
									className={clsxm(
										"rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand-600",
										isActive(href)
											? "bg-brand-50 text-brand-700"
											: "text-gray-600 hover:bg-gray-100",
									)}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>
					<div className="flex shrink-0 items-center gap-2 md:gap-3">
						<NotificationBell />
						<Typography className="hidden max-w-40 truncate text-sm text-gray-600 md:block">
							{user?.name}
						</Typography>
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							leftIcon={LogOut}
							className="hidden md:inline-flex"
						>
							Logout
						</Button>
						<button
							type="button"
							onClick={() => setMenuOpen((o) => !o)}
							aria-expanded={menuOpen}
							aria-controls="student-mobile-menu"
							aria-label={menuOpen ? "Close menu" : "Open menu"}
							className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
						>
							{menuOpen ? <X size={20} /> : <Menu size={20} />}
						</button>
					</div>
				</div>

				{menuOpen && (
					<div
						id="student-mobile-menu"
						className="absolute inset-x-0 top-full border-b border-gray-200 bg-white px-4 pb-4 pt-2 shadow-lg md:hidden"
					>
						<nav aria-label="Mobile" className="flex flex-col gap-1">
							{NAV.map(({ label, href }) => (
								<Link
									key={href}
									href={href}
									aria-current={isActive(href) ? "page" : undefined}
									className={clsxm(
										"rounded-md px-3 py-2.5 text-sm font-medium",
										isActive(href)
											? "bg-brand-50 text-brand-700"
											: "text-gray-700 hover:bg-gray-100",
									)}
								>
									{label}
								</Link>
							))}
						</nav>
						<div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
							<Typography className="min-w-0 truncate text-sm text-gray-600">
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
					</div>
				)}
			</header>
			<main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 md:px-6">
				{children}
			</main>
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
