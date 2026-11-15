"use client";

import Button from "@/components/button/Button";
import Typography from "@/components/Typography";
import { usePostsQuery } from "@/hooks/usePostsQuery";

export default function FetchExamplePage() {
	const { data, isLoading, isError, error, refetch, isFetching } =
		usePostsQuery(10);

	return (
		<div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-white px-4 py-10 text-gray-900">
			<div className="flex items-center justify-between">
				<div>
					<Typography as="h1" weight="bold" className="text-2xl">
						Fetch Example
					</Typography>
					<Typography className="text-sm text-gray-500">
						Posts loaded from JSONPlaceholder via React Query + axios.
					</Typography>
				</div>
				<Button
					variant="outline"
					isLoading={isFetching}
					onClick={() => refetch()}
				>
					Refetch
				</Button>
			</div>

			{isLoading && <p className="text-sm text-gray-500">Loading...</p>}
			{isError && (
				<p className="text-sm text-red-600">
					{error instanceof Error ? error.message : "Failed to load posts."}
				</p>
			)}

			<ul className="flex flex-col gap-3">
				{data?.map((post) => (
					<li key={post.id} className="rounded-lg border border-gray-200 p-4">
						<p className="font-semibold capitalize">{post.title}</p>
						<p className="mt-1 text-sm text-gray-500">{post.body}</p>
					</li>
				))}
			</ul>
		</div>
	);
}
