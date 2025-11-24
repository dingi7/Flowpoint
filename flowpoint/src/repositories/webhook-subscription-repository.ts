import {
  DatabaseService,
  OrganizationIdPayload,
  WebhookSubscription,
  WebhookSubscriptionData,
  WebhookSubscriptionRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getWebhookSubscriptionRepository(
  databaseService: DatabaseService,
): WebhookSubscriptionRepository {
  return getGenericRepository<
    WebhookSubscription,
    WebhookSubscriptionData,
    OrganizationIdPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.WEBHOOK_SUBSCRIPTIONS}`,
    databaseService,
  );
}
