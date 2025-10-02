import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";;
import { getNextPageParam } from "../utils/page-params";
import { ORGANIZATION_ID } from "@/constants";

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

export const useServices = (options: GetOptions) => {
  const currentOrganizationId = ORGANIZATION_ID;
  
  return useInfiniteQuery({
    queryKey: ["services", "get", JSON.stringify(options), currentOrganizationId],
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