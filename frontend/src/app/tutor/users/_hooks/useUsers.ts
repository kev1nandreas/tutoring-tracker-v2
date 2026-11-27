import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	createUser,
	deleteUser,
	fetchUserDetail,
	fetchUsers,
	type UserListParams,
} from "@/services/api/main/admin";

export const useUsers = (params: UserListParams) =>
	useQuery({
		queryKey: ["admin-users", params],
		queryFn: () => fetchUsers(params),
		placeholderData: keepPreviousData,
	});

export const useUserDetail = (id: string | null) =>
	useQuery({
		queryKey: ["admin-user", id],
		queryFn: () => fetchUserDetail(id as string),
		enabled: id !== null,
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

export const useCreateUserMutation = ({
	onSuccess,
}: {
	onSuccess?: () => void;
} = {}) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createUser,
		onSuccess: () => {
			toast.success("User added.");
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message),
	});
};
