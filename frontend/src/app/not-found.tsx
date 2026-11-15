"use client";

import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/button/Button";
import NextImage from "@/components/NextImage";
import { PATH } from "@/shared/path";

export default function NotFound() {
	const router = useRouter();
	const homePath = PATH.HOME;

	return (
		<section className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
			<NextImage
				src="/logo/logo-color.svg"
				alt="Logo"
				width={72}
				height={72}
				serverStaticImg
				priority
				className="w-18"
			/>

			<div>
				<p className="text-6xl font-bold tracking-tight text-brand-700">404</p>
				<h1 className="mt-2 text-xl font-semibold text-gray-900">
					Page not found
				</h1>
				<p className="mt-1 max-w-md text-sm text-gray-500">
					The page you are looking for has been moved, deleted, or the address
					is incorrect.
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3">
				<Button
					variant="brand"
					leftIcon={ArrowLeft}
					onClick={() => router.back()}
				>
					Back
				</Button>
				<Link href={homePath}>
					<Button variant="outline" leftIcon={Home}>
						Go Home
					</Button>
				</Link>
			</div>
		</section>
	);
}
