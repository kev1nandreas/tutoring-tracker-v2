type RetryOptions = {
	/** Total tries, including the first. */
	attempts?: number;
	/** Wait before the next try, in ms (grows each time). */
	baseDelay?: number;
	shouldRetry: (error: unknown) => boolean;
	onRetry?: (nextAttempt: number, delayMs: number) => void;
	signal?: AbortSignal;
};

const sleep = (ms: number, signal?: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(new DOMException("Cancelled", "AbortError"));
			},
			{ once: true },
		);
	});

/** Runs `fn`, trying again with a growing pause when `shouldRetry` says the failure is temporary. */
export async function withRetry<T>(
	fn: () => Promise<T>,
	{
		attempts = 3,
		baseDelay = 1000,
		shouldRetry,
		onRetry,
		signal,
	}: RetryOptions,
): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await fn();
		} catch (error) {
			const cancelled =
				error instanceof DOMException && error.name === "AbortError";
			if (cancelled || attempt >= attempts || !shouldRetry(error)) throw error;

			// 1s, 2s, 4s... plus a little jitter so parallel uploads do not retry in lockstep
			const delay = baseDelay * 2 ** (attempt - 1) + Math.random() * 250;
			onRetry?.(attempt + 1, delay);
			await sleep(delay, signal);
		}
	}
}
