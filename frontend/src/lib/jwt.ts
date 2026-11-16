type JwtClaims = {
	username?: string;
	email?: string;
	role?: string;
	exp?: number;
};

/** Decode (not verify) a JWT payload. The backend verifies the signature. */
export function decodeToken(token: string): JwtClaims | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(
			base64.length + ((4 - (base64.length % 4)) % 4),
			"=",
		);
		const json = decodeURIComponent(
			atob(padded)
				.split("")
				.map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
				.join(""),
		);
		return JSON.parse(json) as JwtClaims;
	} catch {
		return null;
	}
}

export function isTokenExpired(claims: JwtClaims | null): boolean {
	if (!claims?.exp) return true;
	return claims.exp * 1000 <= Date.now();
}
