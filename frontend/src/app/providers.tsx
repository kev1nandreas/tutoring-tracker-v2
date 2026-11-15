"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import {
	QueryClient,
	QueryClientProvider,
	type QueryOptions,
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "react-hot-toast";

import api from "@/lib/api";
import muiTheme from "@/lib/muiTheme";

const defaultQueryFn = async ({ queryKey }: QueryOptions) => {
	const { data } = await api.get(`${queryKey?.[0]}`);
	return data;
};
const queryClient = new QueryClient({
	defaultOptions: { queries: { queryFn: defaultQueryFn } },
});

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AppRouterCacheProvider>
			<ThemeProvider theme={muiTheme}>
				<CssBaseline />
				<QueryClientProvider client={queryClient}>
					<Toaster position="top-center" />
					<NuqsAdapter>{children}</NuqsAdapter>
				</QueryClientProvider>
			</ThemeProvider>
		</AppRouterCacheProvider>
	);
}
