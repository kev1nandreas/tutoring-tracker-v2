import * as React from "react";

const ACTIVITY_EVENTS = [
	"mousemove",
	"mousedown",
	"keydown",
	"touchstart",
	"scroll",
	"wheel",
] as const;

export default function useIdleTimeout(
	onIdle: () => void,
	timeoutMs: number,
	enabled = true,
) {
	const onIdleRef = React.useRef(onIdle);
	onIdleRef.current = onIdle;

	React.useEffect(() => {
		if (!enabled) return;

		let timer: ReturnType<typeof setTimeout>;

		const resetTimer = () => {
			clearTimeout(timer);
			timer = setTimeout(() => onIdleRef.current(), timeoutMs);
		};

		resetTimer();
		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, resetTimer, { passive: true });
		}

		return () => {
			clearTimeout(timer);
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, resetTimer);
			}
		};
	}, [timeoutMs, enabled]);
}
