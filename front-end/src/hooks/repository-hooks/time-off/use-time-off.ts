import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);

type CreateTimeOffParams = Parameters<typeof timeOffRepository.create>[0];
type UpdateTimeOffParams = Parameters<typeof timeOffRepository.update>[0];
type DeleteTimeOffParams = Parameters<typeof timeOffRepository.delete>[0];

export function useTimeOffs(options?: GetOptions) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["timeOffs", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      timeOffRepository.getAll({
        organizationId: organizationId!,
        ...(options || {}),
        pagination: {
          ...(options?.pagination || {}),
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options || {}),
    enabled: !!organizationId,
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateTimeOffParams>({
    mutationKey: ["timeOff", "create"],
    mutationFn: async (params: CreateTimeOffParams) => {
      return timeOffRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffs", "get"] });
    },
  });
}

export function useUpdateTimeOff() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateTimeOffParams>({
    mutationKey: ["timeOff", "update"],
    mutationFn: async (params: UpdateTimeOffParams) => {
      return timeOffRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffs", "get"] });
    },
  });
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteTimeOffParams>({
    mutationKey: ["timeOff", "delete"],
    mutationFn: async (params: DeleteTimeOffParams) => {
      return timeOffRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffs", "get"] });
    },
  });
}
