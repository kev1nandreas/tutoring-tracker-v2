"use client";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import NextImage from "@/components/NextImage";
import { useSidebar } from "@/context/SidebarContext";
import clsxm from "@/lib/clsxm";
import { PATH } from "@/shared/path";

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path?: string;
	description?: string;
	subItems?: { name: string; path: string; description?: string }[];
};

// Add your sidebar entries here. Use `subItems` for a collapsible group.
const NAV_ITEMS: NavItem[] = [
	{
		name: "Dashboard",
		icon: <LayoutGrid className="w-5 h-5" />,
		path: PATH.DASHBOARD,
		description: "Overview",
	},
];

const AppSidebar: React.FC = () => {
	const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar } =
		useSidebar();
	const { user } = useAuthStore();
	const pathname = usePathname();

	const navItems = NAV_ITEMS;

	const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
	const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
		{},
	);
	const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

	const isActive = useCallback(
		(path: string) => pathname.includes(path),
		[pathname],
	);

	const showLabel = isExpanded || isHovered || isMobileOpen;

	const handleSubmenuToggle = (index: number) => {
		setOpenSubmenu((prev) => (prev === index ? null : index));
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: "Intentional"
	useEffect(() => {
		let submenuMatched = false;
		navItems.forEach((nav, index) => {
			nav.subItems?.forEach((subItem) => {
				if (isActive(subItem.path)) {
					setOpenSubmenu(index);
					submenuMatched = true;
				}
			});
		});

		if (!submenuMatched) {
			setOpenSubmenu(null);
		}
	}, [pathname, isActive]);

	useEffect(() => {
		if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
			setSubMenuHeight((prev) => ({
				...prev,
				[openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
			}));
		}
	}, [openSubmenu]);

	return (
		<aside
			className={clsxm(
				"fixed flex flex-col bg-linear-to-b from-brand-700 via-brand-800 to-brand-950 p-5 text-white transition-all duration-300 ease-in-out z-999 lg:translate-x-0",
				isMobileOpen ? "h-[calc(100vh-67px)]" : "h-screen",
				isExpanded || isMobileOpen || isHovered ? "w-70" : "w-22.5",
				isMobileOpen ? "translate-x-0 mt-16.75" : "-translate-x-full",
			)}
			onMouseEnter={() => !isExpanded && setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<button
				type="button"
				onClick={toggleSidebar}
				aria-label="Toggle sidebar width"
				className="absolute z-9999 -right-4 top-8 hidden h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-700 shadow-md lg:flex cursor-pointer"
			>
				{showLabel ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
			</button>

			<div className="relative z-10 flex min-h-0 flex-1 flex-col">
				<Link
					href={PATH.DASHBOARD}
					className={clsxm(
						"mb-8 flex items-center gap-2.5",
						!showLabel && "justify-center",
					)}
				>
					<NextImage
						src="/logo/logo-white.svg"
						alt="Logo"
						width={40}
						height={40}
						serverStaticImg
						className="w-10 shrink-0"
					/>
					{showLabel && (
						<span className="whitespace-nowrap text-lg font-bold tracking-wide text-white">
							Tutoring Tracker
						</span>
					)}
				</Link>

				<nav className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
					<ul className="flex flex-col gap-1.5">
						{navItems.map((nav, index) => (
							<li key={nav.name}>
								{nav.subItems ? (
									<button
										type="button"
										onClick={() => handleSubmenuToggle(index)}
										title={nav.description}
										className={clsxm(
											"relative flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors duration-150",
											showLabel ? "px-3" : "justify-center px-0",
											"text-white/75 hover:bg-white/10 hover:text-white",
										)}
									>
										{nav.icon}
										{showLabel && (
											<span className="whitespace-nowrap">{nav.name}</span>
										)}
										{showLabel && (
											<ChevronDown
												className={clsxm(
													"ml-auto h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
													openSubmenu === index && "rotate-180",
												)}
											/>
										)}
									</button>
								) : (
									nav.path && (
										<Link
											href={nav.path}
											title={nav.description}
											className={clsxm(
												"relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors duration-150",
												showLabel ? "px-3" : "justify-center px-0",
												isActive(nav.path)
													? "bg-white text-brand-700 shadow-sm"
													: "text-white/75 hover:bg-white/10 hover:text-white",
											)}
										>
											{nav.icon}
											{showLabel && (
												<span className="whitespace-nowrap">{nav.name}</span>
											)}
										</Link>
									)
								)}
								{nav.subItems && showLabel && (
									<div
										ref={(el) => {
											subMenuRefs.current[index] = el;
										}}
										className="overflow-hidden transition-all duration-300 ease-in-out"
										style={{
											height:
												openSubmenu === index
													? `${subMenuHeight[index] ?? 0}px`
													: "0px",
										}}
									>
										<ul className="ml-9 mt-1 space-y-1">
											{nav.subItems.map((subItem) => (
												<li key={subItem.name}>
													<Link
														href={subItem.path}
														title={subItem.description}
														className={clsxm(
															"relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
															isActive(subItem.path)
																? "bg-white/15 text-white"
																: "text-white/65 hover:bg-white/10 hover:text-white",
														)}
													>
														{subItem.name}
													</Link>
												</li>
											))}
										</ul>
									</div>
								)}
							</li>
						))}
					</ul>
				</nav>
			</div>

			<div className="relative z-10 border-t border-white/15 pt-4">
				<div
					className={clsxm(
						"flex w-full items-center gap-3 rounded-lg p-2",
						!showLabel && "justify-center",
					)}
				>
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
						{(user?.name ?? "User").charAt(0).toUpperCase()}
					</span>
					{showLabel && (
						<div className="min-w-0 flex-1 text-left">
							<p className="truncate text-sm font-semibold">
								{user?.name ?? "User"}
							</p>
							<p className="truncate text-xs text-white/60">
								{user?.role ?? "Member"}
							</p>
						</div>
					)}
				</div>
			</div>

			<NextImage
				src="/logo/logo-white.svg"
				alt=""
				width={600}
				height={600}
				serverStaticImg
				className="pointer-events-none absolute -bottom-12 -left-14 w-96 select-none opacity-10 -rotate-12"
			/>
		</aside>
	);
};

export default AppSidebar;
