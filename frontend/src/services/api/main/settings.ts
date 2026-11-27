import { ApiError } from "@/lib/errors";
import { get, post, put } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { LoginResponse } from "@/types/login";
import type { PasswordValues, ProfileValues } from "@/types/settings";
import type { User } from "@/types/user";

function fail(Kind: unknown, status: number, fallback: string): never {
	const r = Kind as MainResponse | undefined;
	throw new ApiError(r?.error || r?.message || fallback, status);
}

export async function fetchMe() {
	const { OK, Kind, StatusCode } = await get<MainResponse<User>>(
		MAIN_ENDPOINT.User.Me,
	);
	const data = (Kind as MainResponse<User>)?.data;
	if (!OK || !data) fail(Kind, StatusCode, "Failed to load your settings.");
	return data as User;
}

/** Saves the profile. The username is part of the token, so a new token comes back. */
export async function saveProfile(values: ProfileValues) {
	const { OK, Kind, StatusCode } = await put<MainResponse<LoginResponse>>(
		MAIN_ENDPOINT.User.Profile,
		values,
	);
	const data = (Kind as MainResponse<LoginResponse>)?.data;
	if (!OK || !data) fail(Kind, StatusCode, "Could not save your profile.");
	return data as LoginResponse;
}

export async function sendVerificationEmail() {
	const { OK, Kind, StatusCode } = await post<MainResponse>(
		MAIN_ENDPOINT.User.SendVerification,
		{},
	);
	if (!OK) fail(Kind, StatusCode, "Could not send the email.");
}

export async function setEmailNotifications(enabled: boolean) {
	const { OK, Kind, StatusCode } = await put<MainResponse<User>>(
		MAIN_ENDPOINT.User.EmailNotifications,
		{ enabled },
	);
	const data = (Kind as MainResponse<User>)?.data;
	if (!OK || !data) fail(Kind, StatusCode, "Could not save your choice.");
	return data as User;
}

/** Sets the first password of a Google sign-up, or changes an existing one. */
export async function setPassword({
	current_password,
	new_password,
}: PasswordValues) {
	const { OK, Kind, StatusCode } = await put<MainResponse<User>>(
		MAIN_ENDPOINT.User.Password,
		{ current_password, new_password },
	);
	const data = (Kind as MainResponse<User>)?.data;
	if (!OK || !data) fail(Kind, StatusCode, "Could not save your password.");
	return data as User;
}

export async function verifyEmail(token: string) {
	const { OK, Kind, StatusCode } = await post<MainResponse>(
		MAIN_ENDPOINT.Auth.VerifyEmail,
		{ token },
	);
	if (!OK)
		fail(Kind, StatusCode, "This verification link is invalid or has expired.");
}
