import {
  LoggerService,
  SecretManagerService,
  WebhookSubscriptionRepository,
} from "@/core";

interface Payload {
  organizationId: string;
  subscriptionId: string;
}

interface Dependencies {
  webhookSubscriptionRepository: WebhookSubscriptionRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

export async function removeWebhookSubscriptionFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, subscriptionId } = payload;
  const {
    webhookSubscriptionRepository,
    secretManagerService,
    loggerService,
  } = dependencies;

  loggerService.info("Removing webhook subscription", {
    organizationId,
    subscriptionId,
  });

  // 1. Get the webhook subscription to retrieve the secretId
  const webhookSubscription = await webhookSubscriptionRepository.get({
    id: subscriptionId,
    organizationId,
  });

  if (!webhookSubscription) {
    loggerService.info("Webhook subscription not found", {
      organizationId,
      subscriptionId,
    });
    throw new Error("Webhook subscription not found");
  }

  const secretId = webhookSubscription.secretId;

  // 2. Delete the webhook subscription from Firestore
  try {
    await webhookSubscriptionRepository.delete({
      id: subscriptionId,
      organizationId,
    });

    loggerService.info("Webhook subscription deleted from Firestore", {
      organizationId,
      subscriptionId,
    });
  } catch (error) {
    loggerService.error("Failed to delete webhook subscription from Firestore", error);
    throw new Error("Failed to delete webhook subscription");
  }

  // 3. Delete the secret from Secret Manager
  try {
    await secretManagerService.deleteSecret(secretId);
    loggerService.info("Webhook secret deleted from Secret Manager", {
      secretId,
    });
  } catch (error) {
    loggerService.error("Failed to delete webhook secret from Secret Manager", error);
    // Don't throw here - the subscription is already deleted from Firestore
    // Log the error but don't fail the operation
    loggerService.warn("Secret deletion failed but subscription was removed", {
      secretId,
      subscriptionId,
    });
  }

  loggerService.info("Webhook subscription removed successfully", {
    organizationId,
    subscriptionId,
  });
}

