import axios from "axios";

/**
 * Example of fetching from a public JSON API.
 *
 * This deliberately uses its own axios instance instead of the shared one in
 * `services/api/main`, so the app's auth token is never sent to a third party.
 * Swap `baseURL` (or move to `services/api/main`) for your own backend.
 */
const jsonPlaceholder = axios.create({
	baseURL: "https://jsonplaceholder.typicode.com",
	headers: { Accept: "application/json" },
});

export type Post = {
	id: number;
	userId: number;
	title: string;
	body: string;
};

export async function fetchPosts(limit = 10): Promise<Post[]> {
	const { data } = await jsonPlaceholder.get<Post[]>("/posts", {
		params: { _limit: limit },
	});
	return data;
}
