"use client";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ChevronDown, LogOut, Logs } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import IconButton from "@/components/button/IconButton";
import { useSidebar } from "@/context/SidebarContext";
import clsxm from "@/lib/clsxm";
import { PATH } from "@/shared/path";

const AppHeader: React.FC = () => {
	const { isMobileOpen, toggleMobileSidebar } = useSidebar();
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const router = useRouter();

	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const isMenuOpen = Boolean(anchorEl);

	const handleLogout = () => {
		setAnchorEl(null);
		logout();
		router.push(PATH.LOGIN);
	};

	const initial = (user?.name ?? "User").charAt(0).toUpperCase();

	return (
		<header
			className={clsxm(
				"sticky top-0 z-99 flex w-full items-center justify-between px-4 py-3 lg:px-8",
				isMobileOpen
					? "border-b border-gray-200 bg-white shadow-sm"
					: "bg-transparent",
			)}
		>
			<IconButton
				variant="ghost"
				size="lg"
				icon={Logs}
				className="rounded-lg text-gray-500 shadow-none hover:bg-gray-100 hover:text-gray-700 lg:hidden"
				onClick={toggleMobileSidebar}
				aria-label="Toggle Sidebar"
			/>
			<div className="hidden lg:block" />

			<div className="flex items-center sm:gap-4">
				<button
					type="button"
					onClick={(e) => setAnchorEl(e.currentTarget)}
					className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 cursor-pointer"
				>
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
						{initial}
					</span>
					<ChevronDown
						size={16}
						className={clsxm(
							"hidden text-gray-500 transition-transform sm:block",
							isMenuOpen && "rotate-180",
						)}
					/>
				</button>

				<Menu
					anchorEl={anchorEl}
					open={isMenuOpen}
					onClose={() => setAnchorEl(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					slotProps={{ paper: { className: "w-42" } }}
				>
					<div className="border-b border-gray-100 px-3 py-2">
						<p className="truncate text-sm font-medium text-gray-900">
							{user?.name ?? "User"}
						</p>
						<p className="truncate text-xs text-gray-500">
							{user?.role ?? "Member"}
						</p>
					</div>
					<MenuItem onClick={handleLogout} className="gap-2 text-red-600">
						<LogOut size={16} />
						Logout
					</MenuItem>
				</Menu>
			</div>
		</header>
	);
};

export default AppHeader;
