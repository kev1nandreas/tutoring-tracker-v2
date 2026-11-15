import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/services/api/example/jsonplaceholder";

/** Example React Query hook: loads posts from a public JSON API. */
export function usePostsQuery(limit = 10) {
	return useQuery({
		queryKey: ["example-posts", limit],
		queryFn: () => fetchPosts(limit),
		staleTime: 60 * 1000,
	});
}
