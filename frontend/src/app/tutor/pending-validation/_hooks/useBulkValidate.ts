import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { validateStudents } from "@/services/api/main/student";
import type { ValidateAction } from "@/types/student";

/** Students to change, per tutorial code. */
export type ValidateBatch = { tutorialCode: string; userIds: string[] }[];

/**
 * Accept or reject students across several tutorials. The API works per tutorial, so
 * one request goes out per tutorial; a failure in one does not stop the others.
 */
export const useBulkValidate = ({ onDone }: { onDone?: () => void } = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			batch,
			action,
		}: {
			batch: ValidateBatch;
			action: ValidateAction;
		}) => {
			const results = await Promise.allSettled(
				batch.map((b) => validateStudents(b.tutorialCode, b.userIds, action)),
			);
			const updated = results.reduce(
				(n, r) => n + (r.status === "fulfilled" ? r.value.updated.length : 0),
				0,
			);
			const failed = results.filter((r) => r.status === "rejected").length;
			return { updated, failed, action };
		},
		onSuccess: ({ updated, failed, action }) => {
			const verb = action === "accept" ? "Accepted" : "Rejected";
			if (updated > 0)
				toast.success(
					`${verb} ${updated} ${updated === 1 ? "student" : "students"}.`,
				);
			if (failed > 0)
				toast.error(
					`${failed} ${failed === 1 ? "tutorial" : "tutorials"} could not be updated.`,
				);
			if (updated === 0 && failed === 0)
				toast("Nothing to update. Those requests were already handled.");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-validations"] });
			queryClient.invalidateQueries({ queryKey: ["tutorial"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] });
			onDone?.();
		},
	});
};
