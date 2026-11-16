import Typography from "@/components/Typography";
import { formatDay } from "@/lib/helper";
import type { TutorialItem } from "@/types/dashboard";
import ProgressBar from "./ProgressBar";

type TutorialRowProps = {
	tutorial: TutorialItem;
	/** Extra line under the name, e.g. student count or start date. */
	meta?: string;
	showProgress?: boolean;
	/** Right-aligned slot, e.g. an "Enrolled" badge. */
	trailing?: React.ReactNode;
};

/** One tutorial in a list; shared by tutor and student dashboards. */
export default function TutorialRow({
	tutorial,
	meta,
	showProgress = false,
	trailing,
}: TutorialRowProps) {
	return (
		<li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<Typography
						weight="medium"
						className="truncate text-sm text-gray-900"
					>
						{tutorial.name}
					</Typography>
					<Typography className="text-xs text-gray-500">
						{tutorial.custom_id}
						{meta ? ` · ${meta}` : ""}
					</Typography>
				</div>
				{trailing}
			</div>
			{showProgress && (
				<ProgressBar
					value={tutorial.done_meetings}
					max={tutorial.total_meetings}
					label={
						tutorial.next_meeting_date
							? `${tutorial.done_meetings}/${tutorial.total_meetings} meetings · next ${formatDay(tutorial.next_meeting_date)}`
							: `${tutorial.done_meetings}/${tutorial.total_meetings} meetings`
					}
				/>
			)}
		</li>
	);
}
