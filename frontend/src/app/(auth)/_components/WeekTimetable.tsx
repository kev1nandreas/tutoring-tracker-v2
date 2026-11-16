import clsxm from "@/lib/clsxm";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
// 15:00 to 20:00 in half-hour rows.
const START_HOUR = 15;
const ROWS = 10;

type Subject = "math" | "english" | "physics" | "chemistry";

const SUBJECT_STYLE: Record<Subject, string> = {
	math: "bg-[#d6e6fb] border-[#2f6fd6] text-[#173a78]",
	english: "bg-[#e6defa] border-[#6a4fc9] text-[#3b2a7d]",
	physics: "bg-[#d3f0e0] border-[#1f8a5b] text-[#14573a]",
	chemistry: "bg-[#fbe3cf] border-[#c46a1e] text-[#7a3f0e]",
};

type Session = {
	day: number;
	start: number; // hours, e.g. 16.5 = 16:30
	end: number;
	subject: Subject;
	title: string;
	note: string;
	due?: boolean;
};

const SESSIONS: Session[] = [
	{
		day: 0,
		start: 16,
		end: 17.5,
		subject: "math",
		title: "Algebra",
		note: "Meeting 4",
	},
	{
		day: 1,
		start: 15,
		end: 16,
		subject: "english",
		title: "Essay review",
		note: "2 submissions",
	},
	{
		day: 2,
		start: 17,
		end: 19,
		subject: "physics",
		title: "Kinematics",
		note: "Homework due",
		due: true,
	},
	{
		day: 3,
		start: 16,
		end: 17,
		subject: "chemistry",
		title: "Moles",
		note: "Attendance 9/10",
	},
	{
		day: 4,
		start: 18,
		end: 19.5,
		subject: "math",
		title: "Quiz",
		note: "Meeting 5",
	},
];

// Where "now" sits on the sheet: Wednesday 17:40.
const NOW = { day: 2, time: 17 + 40 / 60 };

const row = (hours: number) => Math.round((hours - START_HOUR) * 2) + 2;
const fmt = (hours: number) =>
	`${Math.floor(hours)}:${hours % 1 ? "30" : "00"}`;

export default function WeekTimetable() {
	const nowTop = ((NOW.time - START_HOUR) / (ROWS / 2)) * 100;

	return (
		<figure
			className="auth-sheet auth-display w-full max-w-[540px] -rotate-1 rounded-md bg-white p-5 tracking-normal"
			aria-label="Example week of tutoring sessions"
		>
			<figcaption className="mb-4 flex items-baseline justify-between">
				<span className="auth-display text-lg font-semibold">This week</span>
				<span className="text-sm text-[var(--ink-soft)]">5 sessions</span>
			</figcaption>

			<div
				className="grid text-xs"
				style={{
					gridTemplateColumns: "2.75rem repeat(5, minmax(0, 1fr))",
					gridTemplateRows: `1.75rem repeat(${ROWS}, 1.6rem)`,
				}}
			>
				{DAYS.map((d, i) => (
					<div
						key={d}
						className={clsxm(
							"self-center pl-1.5 font-semibold text-[var(--ink-soft)]",
							i === NOW.day && "text-[var(--pen)]",
						)}
						style={{ gridColumn: i + 2, gridRow: 1 }}
					>
						{d}
					</div>
				))}

				{Array.from({ length: ROWS / 2 }, (_, i) => START_HOUR + i).map((h) => (
					<div
						key={h}
						className="-translate-y-2 text-[11px] tabular-nums text-[var(--ink-soft)]"
						style={{ gridColumn: 1, gridRow: row(h) }}
					>
						{h}:00
					</div>
				))}

				{/* Hour rules */}
				<div
					className="pointer-events-none relative"
					style={{ gridColumn: "2 / -1", gridRow: `2 / span ${ROWS}` }}
				>
					{Array.from({ length: ROWS / 2 + 1 }, (_, i) => (
						<div
							key={`rule-${START_HOUR + i}`}
							className="absolute inset-x-0 border-t border-[var(--rule)]"
							style={{ top: `${(i / (ROWS / 2)) * 100}%` }}
						/>
					))}
				</div>

				{SESSIONS.map((s, i) => (
					<div
						key={`${s.day}-${s.start}`}
						className={clsxm(
							"auth-session relative m-[2px] flex flex-col overflow-hidden rounded-[5px] border-l-[3px] px-1.5 py-1 leading-tight",
							SUBJECT_STYLE[s.subject],
						)}
						style={
							{
								"--i": i,
								gridColumn: s.day + 2,
								gridRow: `${row(s.start)} / ${row(s.end)}`,
							} as React.CSSProperties
						}
					>
						<span className="font-semibold">{s.title}</span>
						<span className="tabular-nums opacity-75">
							{fmt(s.start)}–{fmt(s.end)}
						</span>
						{s.end - s.start >= 1.5 && (
							<span className="mt-auto">
								{s.due ? (
									<mark className="rounded-[2px] bg-[var(--marker)] px-0.5 text-[var(--ink)]">
										{s.note}
									</mark>
								) : (
									s.note
								)}
							</span>
						)}
					</div>
				))}

				{/* "Now" line, red pen */}
				<div
					className="pointer-events-none relative"
					style={{ gridColumn: NOW.day + 2, gridRow: `2 / span ${ROWS}` }}
				>
					<div
						className="auth-now absolute -inset-x-0.5 flex items-center"
						style={{ top: `${nowTop}%` }}
					>
						<span className="-ml-1 h-2 w-2 rounded-full bg-[var(--pen)]" />
						<span className="h-[2px] flex-1 bg-[var(--pen)]" />
					</div>
				</div>
			</div>
		</figure>
	);
}
