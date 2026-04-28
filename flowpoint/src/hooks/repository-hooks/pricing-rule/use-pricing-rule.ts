import { GetOptions, pricingRuleDataSchema } from "@/core";
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
const pricingRuleRepository =
  repositoryHost.getPricingRuleRepository(databaseService);

type CreatePricingRuleParams = Parameters<typeof pricingRuleRepository.create>[0];
type UpdatePricingRuleParams = Parameters<typeof pricingRuleRepository.update>[0];
type DeletePricingRuleParams = Parameters<typeof pricingRuleRepository.delete>[0];

export function usePricingRules(options: GetOptions = {}) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["pricingRules", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      pricingRuleRepository.getAll({
        organizationId: organizationId!,
        ...options,
        pagination: {
          ...(options.pagination || {}),
          cursor: pageParam,
        },
      }),
    initialPageParam: "",
    getNextPageParam: getNextPageParam(options),
    enabled: !!organizationId,
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreatePricingRuleParams>({
    mutationKey: ["pricingRule", "create"],
    mutationFn: async (params) => {
      pricingRuleDataSchema.parse(params.data);
      return pricingRuleRepository.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingRules"] });
      queryClient.invalidateQueries({ queryKey: ["availableTimeslots"] });
    },
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdatePricingRuleParams>({
    mutationKey: ["pricingRule", "update"],
    mutationFn: async (params) => {
      pricingRuleDataSchema.partial().parse(params.data);
      return pricingRuleRepository.update(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingRules"] });
      queryClient.invalidateQueries({ queryKey: ["availableTimeslots"] });
    },
  });
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeletePricingRuleParams>({
    mutationKey: ["pricingRule", "delete"],
    mutationFn: (params) => pricingRuleRepository.delete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingRules"] });
      queryClient.invalidateQueries({ queryKey: ["availableTimeslots"] });
    },
  });
}
