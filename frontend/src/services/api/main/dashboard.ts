import { get } from "@/services/api/main/call";
import { MAIN_ENDPOINT } from "@/services/api/main/endpoint";
import type { MainResponse } from "@/types/api";
import type { StudentDashboard, TutorDashboard } from "@/types/dashboard";

async function fetchDashboard<T>(endpoint: string): Promise<T> {
	const { OK, Kind } = await get<MainResponse<T>>(endpoint);
	const response = Kind as MainResponse<T>;

	if (!OK || !response?.data) {
		throw new Error(
			response?.error || response?.message || "Failed to load the dashboard.",
		);
	}
	return response.data;
}

export const fetchTutorDashboard = () =>
	fetchDashboard<TutorDashboard>(MAIN_ENDPOINT.Dashboard.Tutor);

export const fetchStudentDashboard = () =>
	fetchDashboard<StudentDashboard>(MAIN_ENDPOINT.Dashboard.Student);
