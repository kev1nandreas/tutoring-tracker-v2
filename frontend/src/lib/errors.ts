export class AccountLockedError extends Error {
	lockedUntil: string;

	constructor(message: string, lockedUntil: string) {
		super(message);
		this.name = "AccountLockedError";
		this.lockedUntil = lockedUntil;
	}
}

/** API failure that keeps the HTTP status, so callers can tell "not found" apart. */
export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}
