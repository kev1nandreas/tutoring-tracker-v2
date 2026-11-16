import { getInitials } from "@/lib/helper";
import type { TutorialStudent } from "@/types/student";

/** Enrolled students who have not handed this homework in yet. */
export default function NotSubmittedList({
	students,
}: {
	students: TutorialStudent[];
}) {
	return (
		<section className="rounded-xl border border-gray-200 bg-white">
			<h2 className="flex items-center justify-between border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
				Not submitted
				<span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
					{students.length}
				</span>
			</h2>

			{students.length === 0 ? (
				<p className="px-5 py-6 text-center text-sm text-gray-400">
					Everyone has submitted.
				</p>
			) : (
				<ul className="divide-y divide-gray-100">
					{students.map((s) => (
						<li key={s.user_id} className="flex items-center gap-3 px-5 py-2.5">
							<span
								aria-hidden
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500"
							>
								{getInitials(s.name)}
							</span>
							<span className="min-w-0 flex-1 truncate text-sm text-gray-700">
								{s.name}
							</span>
							<span className="shrink-0 text-xs text-gray-400">
								@{s.username}
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
