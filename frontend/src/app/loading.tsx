import NextImage from "@/components/NextImage";

export default function Loading() {
	return (
		<section className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-gray-50">
			<div className="relative flex h-24 w-24 items-center justify-center">
				<span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
				<NextImage
					src="/logo/logo-color.svg"
					alt="Logo"
					width={56}
					height={56}
					serverStaticImg
					priority
					className="w-14 animate-pulse"
				/>
			</div>

			<p className="text-sm text-gray-500">Loading…</p>
		</section>
	);
}
