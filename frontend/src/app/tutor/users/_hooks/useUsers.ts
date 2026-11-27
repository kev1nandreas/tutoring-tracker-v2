import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	deleteUser,
	fetchUsers,
	registerTutor,
	type UserListParams,
} from "@/services/api/main/admin";

export const useUsers = (params: UserListParams) =>
	useQuery({
		queryKey: ["admin-users", params],
		queryFn: () => fetchUsers(params),
		placeholderData: keepPreviousData,
	});

export const useDeleteUserMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteUser,
		onSuccess: () => {
			toast.success("User deleted.");
			// their tutorials, students and payments may be gone too
			queryClient.invalidateQueries();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};

export const useRegisterTutorMutation = ({
	onSuccess,
}: {
	onSuccess?: () => void;
} = {}) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: registerTutor,
		onSuccess: () => {
			toast.success("Tutor added.");
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
