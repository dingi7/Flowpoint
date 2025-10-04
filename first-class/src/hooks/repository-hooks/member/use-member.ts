import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery } from "@tanstack/react-query";;
import { getNextPageParam } from "../utils/page-params";
import { ORGANIZATION_ID } from "@/constants";

const databaseService = serviceHost.getDatabaseService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);

export const useMembers = (options: GetOptions) => {
  const currentOrganizationId = ORGANIZATION_ID;
  
  return useInfiniteQuery({
    queryKey: ["members", "get", JSON.stringify(options), currentOrganizationId],
    queryFn: ({ pageParam }) =>
      memberRepository.getAll({
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