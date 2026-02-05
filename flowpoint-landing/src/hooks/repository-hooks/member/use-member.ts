import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery } from "@tanstack/react-query";;
import { getNextPageParam } from "../utils/page-params";
import { useTenant } from "@/app/context/TenantContext";

const databaseService = serviceHost.getDatabaseService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);

export const useMembers = (options: GetOptions) => {
  const { organizationId } = useTenant();
  
  return useInfiniteQuery({
    queryKey: ["members", "get", JSON.stringify(options), organizationId],
    queryFn: ({ pageParam }) =>
      memberRepository.getAll({
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
