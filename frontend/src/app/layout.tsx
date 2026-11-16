import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/app/providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteConfig = {
	title: "Tutoring Tracker",
	description:
		"Plan tutoring sessions, track attendance and homework, and keep payments in order. For tutors and their students.",
	url: process.env.SITE_URL || "http://localhost:3000",
};

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.title}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.title,
	keywords: [
		"tutoring",
		"tutor",
		"student",
		"attendance",
		"homework",
		"lesson schedule",
	],
	appleWebApp: {
		title: siteConfig.title,
		capable: true,
		statusBarStyle: "default",
	},
	openGraph: {
		type: "website",
		siteName: siteConfig.title,
		title: siteConfig.title,
		description: siteConfig.description,
		url: siteConfig.url,
	},
	twitter: {
		card: "summary",
		title: siteConfig.title,
		description: siteConfig.description,
	},
	// Signed-in app: keep it out of search results.
	robots: { index: false, follow: false },
};

export const viewport: Viewport = {
	themeColor: "#2563eb",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			{process.env.NEXT_PUBLIC_RUN_MODE === "production" && <GoogleAnalytics />}
			<body className={`${inter.className}`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
