import { serviceHost } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreateWebhookSubscriptionParams {
  organizationId: string;
  eventTypes: string[];
  callbackUrl: string;
}

export interface CreateWebhookSubscriptionResponse {
  webhookSubscription: {
    id: string;
    eventTypes: string[];
    callbackUrl: string;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
  };
}

const functionsService = serviceHost.getFunctionsService();

export const useCreateWebhookSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateWebhookSubscriptionResponse,
    Error,
    CreateWebhookSubscriptionParams
  >({
    mutationKey: ["createWebhookSubscription"],
    mutationFn: async (params: CreateWebhookSubscriptionParams) => {
      return functionsService.createWebhookSubscription(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate webhook subscriptions queries
      queryClient.invalidateQueries({
        queryKey: ["webhookSubscriptions", variables.organizationId],
      });
    },
  });
};
