import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useQuery } from "@tanstack/react-query";

const databaseService = serviceHost.getDatabaseService();
const userRepository = repositoryHost.getUserRepository(databaseService);

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
