const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || "@example/token";

export const ENV = {
	MODE: process.env.NEXT_PUBLIC_MODE || "development",
	TOKEN_KEY,
	REFRESH_TOKEN_KEY: `${TOKEN_KEY}_refresh`,
	URI: {
		BASE_URL: process.env.NEXT_PUBLIC_API_URL_DEV || "http://localhost:3000",
	},
};
