"use client";

import NextImage from "@/components/NextImage";
import { useSlideIn, useStaggerFadeIn } from "@/hooks/useGsapAnimation";
import Layout from "@/layouts/Layout";

export default function AuthLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const animationRef = useSlideIn<HTMLDivElement>();
	const animationRef2 = useStaggerFadeIn<HTMLDivElement>();

	return (
		<Layout className="flex h-screen bg-gray-100">
			<div className="relative hidden w-[45%] flex-col overflow-hidden bg-linear-to-b from-brand-800 to-brand-950 p-16 lg:flex justify-between">
				<div className="absolute top-[-15%] right-[-15%] h-105 w-105 rounded-full bg-brand-600/30 blur-3xl" />
				<NextImage
					src="/logo/logo-white.svg"
					alt=""
					width={900}
					height={900}
					serverStaticImg
					className="pointer-events-none absolute -bottom-100 -left-10 w-180 select-none opacity-10 -rotate-30"
				/>

				<div
					ref={animationRef}
					className="relative z-10 flex items-center gap-3"
				>
					<NextImage
						src="/logo/logo-white.svg"
						alt="Logo"
						width={40}
						height={40}
						serverStaticImg
						className="w-10"
					/>
					<span className="text-lg font-bold tracking-widest text-white">
						YOUR APP
					</span>
				</div>

				<div ref={animationRef2} className="relative z-10 max-w-sm mt-10">
					<h1 className="text-5xl leading-tight font-bold text-white">
						Build faster with <span className="text-gold-400">Confidence</span>
					</h1>
					<div className="mt-6 h-1 w-16 rounded-full bg-gold-400" />
				</div>

				<div className="h-30" />
			</div>

			<div className="relative flex w-full flex-1 flex-col items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">{children}</div>
				<p className="absolute bottom-6 text-xs text-gray-400">
					© {new Date().getFullYear()} Your Company. All rights reserved.
				</p>
			</div>
		</Layout>
	);
}
