import {
	BookOpen,
	File,
	Film,
	Image as ImageIcon,
	Presentation,
} from "lucide-react";
import clsxm from "@/lib/clsxm";
import type { AttachmentType } from "@/types/attachment";

const STYLE = {
	ppt: { icon: Presentation, tone: "bg-orange-50 text-orange-600" },
	picture: { icon: ImageIcon, tone: "bg-green-50 text-green-600" },
	book: { icon: BookOpen, tone: "bg-purple-50 text-purple-600" },
	video: { icon: Film, tone: "bg-red-50 text-red-600" },
	other: { icon: File, tone: "bg-gray-100 text-gray-600" },
} as const;

/** Square badge with the icon of an attachment category. */
export default function AttachmentIcon({
	type,
	className,
}: {
	type: AttachmentType;
	className?: string;
}) {
	const { icon: Icon, tone } = STYLE[type] ?? STYLE.other;

	return (
		<span
			aria-hidden
			className={clsxm(
				"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
				tone,
				className,
			)}
		>
			<Icon size={20} />
		</span>
	);
}
