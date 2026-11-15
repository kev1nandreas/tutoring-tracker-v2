import PrimaryLink from "@/components/links/PrimaryLink";
import Typography from "@/components/Typography";
import Layout from "@/layouts/Layout";
import { PATH } from "@/shared/path";

export default function HomePage() {
	return (
		<Layout withNavbar withFooter>
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-gray-900">
				<Typography as="h1" weight="bold" className="text-4xl">
					Next Dashboard Starter
				</Typography>
				<Typography className="text-gray-500">
					Replace this page with your own landing page.
				</Typography>
				<div className="flex gap-4">
					<PrimaryLink variant="blue" href="/sandbox">
						Sandbox
					</PrimaryLink>
					<PrimaryLink variant="green" href={PATH.LOGIN}>
						Login
					</PrimaryLink>
				</div>
			</div>
		</Layout>
	);
}
