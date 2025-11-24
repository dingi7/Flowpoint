import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);

type CreateMemberParams = Parameters<typeof memberRepository.create>[0];
type UpdateMemberParams = Parameters<typeof memberRepository.update>[0];

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateMemberParams>({
    mutationKey: ["member", "create"],
    mutationFn: async (params: CreateMemberParams) => {
      return memberRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", "get"] });
    },
  });
};

export const useMembers = (options: GetOptions) => {
  const currentOrganizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: [
      "members",
      "get",
      JSON.stringify(options),
      currentOrganizationId,
    ],
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

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateMemberParams>({
    mutationKey: ["member", "update"],
    mutationFn: async (params: UpdateMemberParams) => {
      return memberRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", "get"] });
    },
  });
};
