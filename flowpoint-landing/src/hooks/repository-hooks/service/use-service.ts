import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery } from "@tanstack/react-query";;
import { getNextPageParam } from "../utils/page-params";
import { useTenant } from "@/app/context/TenantContext";

const databaseService = serviceHost.getDatabaseService();

const serviceRepository = repositoryHost.getServiceRepository(databaseService);

export const useServices = (options: GetOptions) => {
  const { organizationId } = useTenant();
  
  return useInfiniteQuery({
    queryKey: ["services", "get", JSON.stringify(options), organizationId],
    queryFn: ({ pageParam }) =>
      serviceRepository.getAll({
        ...options,
        organizationId: organizationId,
        pagination: {
          ...options.pagination,    
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options),
    enabled: !!organizationId,
  });
};
