import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface RemoveWebhookSubscriptionParams {
  organizationId: string;
  subscriptionId: string;
}

const functionsService = serviceHost.getFunctionsService();

export const useRemoveWebhookSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveWebhookSubscriptionParams>({
    mutationKey: ["removeWebhookSubscription"],
    mutationFn: async (params: RemoveWebhookSubscriptionParams) => {
      return functionsService.removeWebhookSubscription(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate webhook subscriptions queries
      queryClient.invalidateQueries({
        queryKey: ["webhookSubscriptions", variables.organizationId],
      });
    },
  });
};
