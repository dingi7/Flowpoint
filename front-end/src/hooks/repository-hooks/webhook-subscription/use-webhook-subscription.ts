import { GetOptions } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { getNextPageParam } from "../utils/page-params";

const databaseService = serviceHost.getDatabaseService();
const webhookSubscriptionRepository = repositoryHost.getWebhookSubscriptionRepository(databaseService);

export function useWebhookSubscriptions(options: GetOptions = {}) {
  const organizationId = useCurrentOrganizationId();

  return useInfiniteQuery({
    queryKey: ["webhookSubscriptions", organizationId, JSON.stringify(options)],
    queryFn: ({ pageParam }) =>
      webhookSubscriptionRepository.getAll({
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

