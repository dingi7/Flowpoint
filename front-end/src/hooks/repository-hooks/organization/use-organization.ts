import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const databaseService = serviceHost.getDatabaseService();

const organizationRepository = repositoryHost.getOrganizationRepository(databaseService);

type UpdateOrganizationParams = Parameters<typeof organizationRepository.update>[0];
type DeleteOrganizationParams = Parameters<typeof organizationRepository.delete>[0];

export const useGetOrganizationById = (organizationId: string) => {
  return useQuery({
    queryKey: ["organization", "get", organizationId],
    queryFn: async () => 
      organizationRepository.get({id: organizationId}),
    enabled: !!organizationId,
  });
}

export const useGetOrganizationsByIds = (organizationIds: string[]) => {
  return useQuery({
    queryKey: ["organizations", "getMany", organizationIds],
    queryFn: async () => 
      organizationRepository.getMany({ids: organizationIds}),
    enabled: !!organizationIds.length,
  });
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateOrganizationParams>({
    mutationKey: ["organization", "update"],
    mutationFn: async (params: UpdateOrganizationParams) => {
      return organizationRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", "get"] });
    },
  });
}

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteOrganizationParams>({
    mutationKey: ["organization", "delete"],
    mutationFn: async (params: DeleteOrganizationParams) => {
      return organizationRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", "get"] });
    },
  });
}