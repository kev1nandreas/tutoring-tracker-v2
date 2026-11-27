"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Switch from "@mui/material/Switch";
import {
	BadgeCheck,
	KeyRound,
	Mail,
	Phone,
	School,
	TriangleAlert,
	User,
} from "lucide-react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DashboardError from "@/components/dashboard/DashboardError";
import Input from "@/components/form/Input";
import LabelText from "@/components/form/LabelText";
import {
	useMe,
	useSaveProfile,
	useSendVerification,
	useSetPassword,
	useToggleEmailNotifications,
} from "@/hooks/useSettings";
import {
	type PasswordValues,
	type ProfileValues,
	passwordSchema,
	profileSchema,
} from "@/types/settings";
import type { User as UserType } from "@/types/user";

function ProfileCard({ me }: { me: UserType }) {
	const save = useSaveProfile();
	const methods = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		values: {
			name: me.name,
			email: me.email,
			school: me.school ?? "",
			phone: me.phone ?? "",
			username: me.username,
		},
	});

	const emailChanged =
		methods.watch("email").trim().toLowerCase() !== me.email.toLowerCase();

	const onSubmit: SubmitHandler<ProfileValues> = (values) =>
		save.mutate(values);

	return (
		<DashboardCard
			title="Profile"
			description="Your details, as tutors see them."
		>
			<FormProvider {...methods}>
				<form
					onSubmit={methods.handleSubmit(onSubmit)}
					className="flex flex-col gap-5"
				>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Full name
						</LabelText>
						<Input id="name" leftIcon={User} autoComplete="name" />
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Email
						</LabelText>
						<Input
							id="email"
							type="email"
							leftIcon={Mail}
							autoComplete="email"
						/>
						{emailChanged && (
							<p className="mt-1.5 text-xs text-amber-700">
								A new email must be verified again before it gets notification
								emails.
							</p>
						)}
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								School
							</LabelText>
							<Input
								id="school"
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
					</div>
					<div>
						<LabelText labelTextClasname="mb-1.5 font-semibold">
							Username
						</LabelText>
						<Input id="username" leftIcon={User} autoComplete="username" />
					</div>
					<div>
						<Button
							type="submit"
							variant="brand"
							isLoading={save.isPending}
							disabled={!methods.formState.isDirty}
						>
							Save changes
						</Button>
					</div>
				</form>
			</FormProvider>
		</DashboardCard>
	);
}

function EmailCard({ me }: { me: UserType }) {
	const send = useSendVerification();
	const toggle = useToggleEmailNotifications();
	const verified = me.email_verified === true;
	const enabled = verified && me.email_notifications !== false;

	return (
		<DashboardCard
			title="Email notifications"
			description="Get a copy of your notifications in your inbox."
		>
			<div className="flex flex-col gap-5">
				<div
					className={
						verified
							? "flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-800"
							: "flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
					}
				>
					{verified ? (
						<BadgeCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
					) : (
						<TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
					)}
					<div className="min-w-0 flex-1">
						<p className="font-semibold">
							{verified ? "Email verified" : "Email not verified"}
						</p>
						<p className="break-all">{me.email}</p>
						{!verified && (
							<>
								<p className="mt-1">
									Verify your email to turn on email notifications. We will send
									you a link.
								</p>
								<Button
									variant="outline"
									size="sm"
									className="mt-3"
									isLoading={send.isPending}
									onClick={() => send.mutate()}
								>
									Send verification email
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between gap-4">
					<div>
						<p
							id="email-notif-label"
							className="text-sm font-semibold text-gray-900"
						>
							Send me notifications by email
						</p>
						<p className="text-xs text-gray-500">
							{verified
								? "New material, finished download packages and other updates."
								: "Available after you verify your email."}
						</p>
					</div>
					<Switch
						checked={enabled}
						disabled={!verified || toggle.isPending}
						onChange={(_, checked) => toggle.mutate(checked)}
						slotProps={{ input: { "aria-labelledby": "email-notif-label" } }}
					/>
				</div>
			</div>
		</DashboardCard>
	);
}

const EMPTY_PASSWORDS: PasswordValues = {
	current_password: "",
	new_password: "",
	confirm_password: "",
};

/** Set a first password (Google sign-ups) or change the current one. */
function PasswordCard({ me }: { me: UserType }) {
	const hasPassword = me.has_password !== false;
	const methods = useForm<PasswordValues>({
		resolver: zodResolver(passwordSchema(hasPassword)),
		defaultValues: EMPTY_PASSWORDS,
	});
	const save = useSetPassword({
		onSuccess: () => methods.reset(EMPTY_PASSWORDS),
	});

	return (
		<DashboardCard
			title={hasPassword ? "Password" : "Set a password"}
			description={
				hasPassword
					? "Change the password you sign in with."
					: "You signed up with Google. Set a password to also sign in with your email."
			}
		>
			<FormProvider {...methods}>
				<form
					id="password"
					onSubmit={methods.handleSubmit((v) => save.mutate(v))}
					className="flex flex-col gap-5"
					noValidate
				>
					{!hasPassword && (
						<div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
							<TriangleAlert
								size={18}
								className="mt-0.5 shrink-0"
								aria-hidden
							/>
							<p>
								Your account has no password yet, so for now you can only sign
								in with Google.
							</p>
						</div>
					)}
					{hasPassword && (
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Current password
							</LabelText>
							<Input
								id="current_password"
								type="password"
								leftIcon={KeyRound}
								autoComplete="current-password"
							/>
						</div>
					)}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								New password
							</LabelText>
							<Input
								id="new_password"
								type="password"
								leftIcon={KeyRound}
								autoComplete="new-password"
							/>
						</div>
						<div>
							<LabelText labelTextClasname="mb-1.5 font-semibold">
								Confirm new password
							</LabelText>
							<Input
								id="confirm_password"
								type="password"
								leftIcon={KeyRound}
								autoComplete="new-password"
							/>
						</div>
					</div>
					<div>
						<Button type="submit" variant="brand" isLoading={save.isPending}>
							{hasPassword ? "Change password" : "Set password"}
						</Button>
					</div>
				</form>
			</FormProvider>
		</DashboardCard>
	);
}

/** Profile and email settings of the signed-in user. Shared by the student and tutor pages. */
export default function SettingsView() {
	const { data: me, isLoading, isError, error, refetch } = useMe();

	if (isError) {
		return <DashboardError message={error.message} onRetry={() => refetch()} />;
	}
	if (isLoading || !me) {
		return (
			<div
				className="mx-auto flex w-full max-w-3xl flex-col gap-3 pt-2 pb-16 sm:pt-4"
				aria-busy="true"
			>
				{[0, 1, 2].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
				))}
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-2 pb-16 sm:pt-4">
			<ProfileCard me={me} />
			<PasswordCard me={me} />
			<EmailCard me={me} />
		</div>
	);
}
