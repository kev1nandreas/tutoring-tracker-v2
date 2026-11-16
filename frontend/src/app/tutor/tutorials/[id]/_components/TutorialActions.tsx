"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import Button from "@/components/button/Button";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import { PATH } from "@/shared/path";
import type { Tutorial } from "@/types/tutorial";
import TutorialFormDialog from "../../_components/TutorialFormDialog";
import { useDeleteTutorialMutation } from "../../_hooks/useDeleteTutorialMutation";

/** Edit and Delete for one tutorial. Delete asks first, then returns to the list. */
export default function TutorialActions({ tutorial }: { tutorial: Tutorial }) {
	const router = useRouter();
	const [isEditOpen, setIsEditOpen] = React.useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

	const remove = useDeleteTutorialMutation(tutorial.id, {
		onSuccess: () => router.replace(PATH.TUTORIALS),
	});

	return (
		<>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					leftIcon={Pencil}
					onClick={() => setIsEditOpen(true)}
				>
					Edit
				</Button>
				<Button
					variant="red"
					size="sm"
					leftIcon={Trash2}
					isLoading={remove.isPending}
					onClick={() => setIsDeleteOpen(true)}
				>
					Delete
				</Button>
			</div>

			<TutorialFormDialog
				isOpen={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				tutorial={tutorial}
			/>

			<ConfirmationDialog
				isOpen={isDeleteOpen}
				setIsOpen={setIsDeleteOpen}
				message={`Delete "${tutorial.name}"? Its meetings, uploaded files, submissions and student list are deleted too. This cannot be undone.`}
				confirmLabel="Delete"
				cancelLabel="Cancel"
				confirmVariant="red"
				onConfirm={() => remove.mutate()}
			/>
		</>
	);
}
