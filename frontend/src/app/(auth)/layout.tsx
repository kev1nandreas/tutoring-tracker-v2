import "./auth.css";

import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import NextImage from "@/components/NextImage";
import clsxm from "@/lib/clsxm";
import WeekTimetable from "./_components/WeekTimetable";

const display = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["500", "600", "700"],
	variable: "--font-display",
});

const body = Atkinson_Hyperlegible({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-body",
});

function Wordmark({ className }: { className?: string }) {
	return (
		<div className={clsxm("flex items-center gap-2.5", className)}>
			<NextImage
				src="/logo/logo-color.svg"
				alt=""
				width={32}
				height={32}
				serverStaticImg
				className="w-8"
			/>
			<span className="auth-display text-lg font-semibold">
				Tutoring Tracker
			</span>
		</div>
	);
}

export default function AuthLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<main
			className={clsxm(
				"auth-root flex min-h-screen",
				display.variable,
				body.variable,
			)}
		>
			<section className="auth-graph relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-[var(--rule)] px-10 py-12 lg:flex">
				<Wordmark />

				<div className="flex flex-col gap-10">
					<div className="max-w-md">
						<h1 className="auth-display text-[2.75rem] leading-[1.05] font-bold">
							Your tutoring week, all in one place.
						</h1>
						<p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--ink-soft)]">
							Tutors plan meetings and check homework. Students see what is due
							and when the next class starts.
						</p>
					</div>
					<WeekTimetable />
				</div>

				<p className="text-sm text-[var(--ink-soft)]">
					© {new Date().getFullYear()} Tutoring Tracker
				</p>
			</section>

			<section className="flex min-w-0 flex-1 flex-col">
				<div className="auth-graph border-b border-[var(--rule)] px-6 py-5 sm:px-12 lg:hidden">
					<Wordmark />
				</div>
				<div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
					<div className="w-full max-w-[520px]">{children}</div>
				</div>
			</section>
		</main>
	);
}
