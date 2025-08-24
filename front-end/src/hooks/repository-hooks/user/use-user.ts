import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const databaseService = serviceHost.getDatabaseService();
const userRepository = repositoryHost.getUserRepository(databaseService);

type UpdateUserParams = Parameters<typeof userRepository.update>[0];

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", "id", id],
    queryFn: () => userRepository.get({ id }),
    enabled: !!id,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => userRepository.getAllGroup({}),
  });
};

export const usePaginatedUsers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["users", "paginated", page, limit],
    queryFn: () =>
      userRepository.getAll({
        pagination: {
          limit,
          cursor: page > 1 ? String((page - 1) * limit) : undefined,
        },
        orderBy: {
          field: "createdAt",
          direction: "desc",
        },
      }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateUserParams>({
    mutationKey: ["user", "update"],
    mutationFn: async (params: UpdateUserParams) => {
      return userRepository.update(params);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", "id", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
