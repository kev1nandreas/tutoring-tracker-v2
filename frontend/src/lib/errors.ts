export class AccountLockedError extends Error {
	lockedUntil: string;

	constructor(message: string, lockedUntil: string) {
		super(message);
		this.name = "AccountLockedError";
		this.lockedUntil = lockedUntil;
	}
}
