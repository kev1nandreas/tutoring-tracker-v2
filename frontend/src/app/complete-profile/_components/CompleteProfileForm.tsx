"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, School, User } from "lucide-react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import Typography from "@/components/Typography";
import {
	type CompleteProfileRequest,
	completeProfileSchema,
} from "@/types/complete-profile";
import { useCompleteProfileMutation } from "../_hooks/useCompleteProfileMutation";

export default function CompleteProfileForm() {
	const user = useAuthStore.useUser();
	const mutation = useCompleteProfileMutation();

	const methods = useForm<CompleteProfileRequest>({
		resolver: zodResolver(completeProfileSchema),
		defaultValues: {
			name: user?.name ?? "",
			school: user?.school ?? "",
			phone: user?.phone ?? "",
			username: user?.username ?? "",
		},
	});

	const onSubmit: SubmitHandler<CompleteProfileRequest> = (data) =>
		mutation.mutate(data);

	return (
		<div className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
			<Typography as="h1" className="text-2xl" weight="bold">
				Finish your account
			</Typography>
			<Typography className="mt-2 text-sm text-gray-600">
				Google gave us your name and email ({user?.email}). We still need a few
				details before you can join classes.
			</Typography>

			<FormProvider {...methods}>
				<form
					onSubmit={methods.handleSubmit(onSubmit)}
					className="mt-6 flex flex-col gap-5"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Full name
						</LabelText>
						<Input id="name" leftIcon={User} autoComplete="name" />
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							School
						</LabelText>
						<Input
							id="school"
							placeholder="Enter your school"
							leftIcon={School}
							autoComplete="organization"
						/>
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Phone
						</LabelText>
						<Input
							id="phone"
							type="tel"
							placeholder="08xxxxxxxxxx"
							leftIcon={Phone}
							autoComplete="tel"
						/>
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Username
						</LabelText>
						<Input
							id="username"
							placeholder="Choose a username"
							leftIcon={User}
							autoComplete="username"
						/>
					</div>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						isLoading={mutation.isPending}
						className="w-full"
					>
						Save and continue
					</Button>
				</form>
			</FormProvider>
		</div>
	);
}
