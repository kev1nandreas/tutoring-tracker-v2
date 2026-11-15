import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/configs/environment";
import {
	getRefreshToken,
	getToken,
	removeToken,
	setTokens,
} from "@/lib/cookies";
import { MAIN_ENDPOINT } from "./endpoint";

const baseURL = ENV.URI.BASE_URL;
const isServer = typeof window === "undefined";

const api = axios.create({
	baseURL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(async (config) => {
	// Respect an Authorization header the caller already set explicitly
	// (e.g. resetting a password with a one-off reset token instead of
	// the stored session token).
	if (config.headers.Authorization) {
		return config;
	}

	if (isServer) {
		const { cookies } = await import("next/headers");
		const token = (await cookies()).get(ENV.TOKEN_KEY)?.value;

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	} else {
		const token = getToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}

	return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

async function readRefreshToken(): Promise<string | undefined> {
	if (isServer) {
		const { cookies } = await import("next/headers");
		return (await cookies()).get(ENV.REFRESH_TOKEN_KEY)?.value;
	}
	return getRefreshToken();
}

async function persistTokens(accessToken: string, refreshToken: string) {
	if (isServer) {
		const { cookies } = await import("next/headers");
		const store = await cookies();
		store.set(ENV.TOKEN_KEY, accessToken, { path: "/" });
		store.set(ENV.REFRESH_TOKEN_KEY, refreshToken, { path: "/" });
	} else {
		setTokens(accessToken, refreshToken);
	}
}

async function clearTokens() {
	if (isServer) {
		const { cookies } = await import("next/headers");
		const store = await cookies();
		store.delete(ENV.TOKEN_KEY);
		store.delete(ENV.REFRESH_TOKEN_KEY);
	} else {
		removeToken();
	}
}

/**
 * Exchanges the stored refresh token for a fresh access/refresh token pair,
 * Returns the new access token, or null if the refresh
 * failed (missing/expired refresh token, backend error, etc).
 */
async function refreshAccessToken(): Promise<string | null> {
	const refresh_token = await readRefreshToken();
	if (!refresh_token) {
		return null;
	}

	try {
		const { data } = await axios.post(
			`${baseURL}${MAIN_ENDPOINT.Auth.RefreshToken}`,
			{
				refresh_token,
			},
		);

		const newAccessToken: string | undefined = data?.data?.access_token;
		const newRefreshToken: string | undefined = data?.data?.refresh_token;

		if (!newAccessToken || !newRefreshToken) {
			return null;
		}

		await persistTokens(newAccessToken, newRefreshToken);
		return newAccessToken;
	} catch {
		return null;
	}
}

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const config = error.config as RetryableConfig | undefined;
		const status = error.response?.status;
		const url = config?.url ?? "";
		// Never try to refresh off the back of an auth call itself
		// (login/refresh/logout) - that would just loop.
		const isAuthEndpoint = url.includes("/auth/");

		if (status !== 401 || !config || config._retry || isAuthEndpoint) {
			return Promise.reject(error);
		}

		config._retry = true;

		const newAccessToken = await refreshAccessToken();
		if (!newAccessToken) {
			await clearTokens();
			return Promise.reject(error);
		}

		config.headers.Authorization = `Bearer ${newAccessToken}`;
		return api(config);
	},
);

export default api;
