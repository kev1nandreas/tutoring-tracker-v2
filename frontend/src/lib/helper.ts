export type ExtractProps<T> = T extends React.ComponentType<infer P> ? P : T;

export function getInitials(name: string) {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export function formatCurrency(value: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value);
}

export function formatNumber(value: number) {
	return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(value: string | null | undefined) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(value));
}

export function formatPercent(value: number) {
	const formatted = new Intl.NumberFormat("id-ID", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Math.abs(value));

	return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

/**
 * Short rupiah for stat tiles, using Indonesian magnitude suffixes:
 * rb (ribu), jt (juta), M (miliar), T (triliun). Falls back to the full
 * format below a thousand so small numbers stay exact.
 */
export function formatCompactCurrency(value: number) {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";

	const units: [number, string][] = [
		[1_000_000_000_000, "T"],
		[1_000_000_000, "M"],
		[1_000_000, "jt"],
		[1_000, "rb"],
	];

	for (const [threshold, suffix] of units) {
		if (abs >= threshold) {
			const scaled = new Intl.NumberFormat("id-ID", {
				maximumFractionDigits: 2,
			}).format(abs / threshold);

			return `${sign}Rp ${scaled} ${suffix}`;
		}
	}

	return formatCurrency(value);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["day", 86_400],
	["hour", 3_600],
	["minute", 60],
];

export function formatRelativeTime(value: string) {
	const seconds = (new Date(value).getTime() - Date.now()) / 1000;

	if (Math.abs(seconds) >= 7 * 86_400) return formatDate(value);

	const formatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

	for (const [unit, size] of RELATIVE_UNITS) {
		if (Math.abs(seconds) >= size) {
			return formatter.format(Math.trunc(seconds / size), unit);
		}
	}

	return "Baru saja";
}

/** "YYYY-MM-DD" -> "Mon 17 Nov" (parsed as a local date, so no timezone shift). */
export function formatDay(value: string | null | undefined) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
	}).format(new Date(`${value}T00:00:00`));
}

/** "10:00", "11:30" -> "10:00–11:30". */
export function formatTimeRange(start: string, end: string) {
	return start && end ? `${start}–${end}` : start || end || "";
}

/** ISO or "YYYY-MM-DD" -> "17 Nov 2026" (date part only, no timezone shift). */
export function formatShortDate(value: string | null | undefined) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

/** "2026-11-20T10:30:00+07:00" -> "10:30". Reads the wall time as written, no timezone conversion. */
export function timeOf(value: string | null | undefined) {
	return /T(\d{2}:\d{2})/.exec(value ?? "")?.[1] ?? "";
}

/** Sort key: date plus start time as written, e.g. "2026-11-20 10:30". */
function startKey(m: { date: string; time_start: string }) {
	return `${m.date.slice(0, 10)} ${timeOf(m.time_start)}`;
}

/** Oldest first, by date and then start time. Returns a new array. */
export function sortByStart<T extends { date: string; time_start: string }>(
	meetings: T[],
) {
	return [...meetings].sort((a, b) => startKey(a).localeCompare(startKey(b)));
}

/** Local date as "YYYY-MM-DD". */
export function todayISO() {
	return new Date().toLocaleDateString("en-CA");
}

/** 1536 -> "1.5 KB", 5242880 -> "5 MB". */
export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1024;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
