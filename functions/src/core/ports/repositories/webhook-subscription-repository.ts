import {
  GenericRepository,
  OrganizationIDPayload,
  WebhookSubscription,
  WebhookSubscriptionData,
} from "@/core";

export type WebhookSubscriptionRepository = GenericRepository<
  WebhookSubscription,
  WebhookSubscriptionData,
  OrganizationIDPayload
>;
