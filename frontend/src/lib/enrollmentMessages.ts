import type { ValidateAction } from "@/types/student";

/** Confirmation question for accepting or rejecting `subject` ("Rina Pratama", "3 students"). */
export const validationQuestion = (action: ValidateAction, subject: string) =>
	action === "accept"
		? `Accept ${subject}?`
		: `Reject ${subject}? A rejected request cannot be set back to pending.`;
