import { GenericRepository, OrganizationIdPayload, WebhookSubscription, WebhookSubscriptionData } from "@/core";

export type WebhookSubscriptionRepository = GenericRepository<
  WebhookSubscription,
  WebhookSubscriptionData,
  OrganizationIdPayload
>;

