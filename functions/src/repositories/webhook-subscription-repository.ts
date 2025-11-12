import {
  DatabaseService,
  OrganizationIDPayload,
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
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.WEBHOOK_SUBSCRIPTIONS}`,
    databaseService,
  );
}
