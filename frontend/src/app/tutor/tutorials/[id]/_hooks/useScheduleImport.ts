import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { saveFile } from "@/hooks/useExportMutation";
import {
	downloadScheduleTemplate,
	importSchedule,
} from "@/services/api/main/schedule-import";

export const useScheduleTemplateDownload = () =>
	useMutation({
		mutationFn: downloadScheduleTemplate,
		onSuccess: (file) =>
			saveFile(
				file.base64,
				file.contentType,
				file.filename ?? "schedule-template.xlsx",
			),
		onError: (error: Error) => toast.error(error.message),
	});

export const useScheduleImport = (
	tutorialId: string,
	{ onSuccess }: { onSuccess?: (created: number) => void } = {},
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (file: File) => importSchedule(tutorialId, file),
		onSuccess: (created) => {
			toast.success(
				`${created} ${created === 1 ? "meeting" : "meetings"} imported.`,
			);
			queryClient.invalidateQueries({
				queryKey: ["tutorial", tutorialId, "meetings"],
			});
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
			onSuccess?.(created);
		},
		// row errors are shown in the dialog; other failures get a toast
		onError: (error: Error) => {
			if (error.name !== "ScheduleImportError") toast.error(error.message);
		},
	});
};
