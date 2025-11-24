import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();

const serviceRepository = repositoryHost.getServiceRepository(databaseService);

type CreateServiceParams = Parameters<typeof serviceRepository.create>[0];
type UpdateServiceParams = Parameters<typeof serviceRepository.update>[0];
type DeleteServiceParams = Parameters<typeof serviceRepository.delete>[0];

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateServiceParams>({
    mutationKey: ["service", "create"],
    mutationFn: async (params: CreateServiceParams) => {
      return serviceRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "get"] });
    },
  });
};

export const useService = (id: string) => {
  const currentOrganizationId = useCurrentOrganizationId();

  return useQuery({
    queryKey: ["service", "get", id, currentOrganizationId],
    queryFn: () =>
      serviceRepository.get({
        id,
        organizationId: currentOrganizationId!,
      }),
    enabled: !!id && !!currentOrganizationId,
  });
};

export const useServices = (options: GetOptions) => {
  const currentOrganizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: [
      "services",
      "get",
      JSON.stringify(options),
      currentOrganizationId,
    ],
    queryFn: ({ pageParam }) =>
      serviceRepository.getAll({
        ...options,
        organizationId: currentOrganizationId!,
        pagination: {
          ...options.pagination,
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options),
    enabled: !!currentOrganizationId,
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateServiceParams>({
    mutationKey: ["service", "update"],
    mutationFn: async (params: UpdateServiceParams) => {
      return serviceRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "get"] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteServiceParams>({
    mutationKey: ["service", "delete"],
    mutationFn: async (params: DeleteServiceParams) => {
      return serviceRepository.delete(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "get"] });
    },
  });
};
