import {
  LoggerService,
  SecretManagerService,
  WebhookSubscription,
  WEBHOOK_EVENT_TYPE,
  WEBHOOK_SUBSCRIPTION_STATUS,
} from "@/core";
import { createHmac } from "crypto";

interface Payload {
  eventType: WEBHOOK_EVENT_TYPE;
  data: unknown;
  organizationId: string;
  webhookSubscriptions: WebhookSubscription[];
}

interface Dependencies {
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

export async function sendWebhookFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { eventType, data, organizationId, webhookSubscriptions } = payload;
  const { secretManagerService, loggerService } = dependencies;

  // Filter subscriptions that match the event type and are active
  const matchingSubscriptions = webhookSubscriptions.filter(
    (subscription) =>
      subscription.status === WEBHOOK_SUBSCRIPTION_STATUS.ACTIVE &&
      subscription.eventTypes.includes(eventType),
  );

  if (matchingSubscriptions.length === 0) {
    loggerService.info("No matching webhook subscriptions found", {
      eventType,
      organizationId,
    });
    return;
  }

  loggerService.info("Sending webhooks", {
    eventType,
    organizationId,
    subscriptionCount: matchingSubscriptions.length,
  });

  // Send webhook for each matching subscription
  const webhookPromises = matchingSubscriptions.map(async (subscription) => {
    try {
      // Get the secret from Secret Manager
      const secret = await secretManagerService.getSecret(subscription.secretId);

      if (!secret) {
        loggerService.error("Webhook secret not found", {
          subscriptionId: subscription.id,
          secretId: subscription.secretId,
        });
        return;
      }

      // Create the webhook payload
      const webhookPayload = {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
      };

      const payloadString = JSON.stringify(webhookPayload);

      // Sign the payload with HMAC SHA256
      const signature = createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");

      // Send webhook to callback URL
      const response = await fetch(subscription.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": eventType,
        },
        body: payloadString,
      });

      if (!response.ok) {
        loggerService.error("Failed to send webhook", {
          subscriptionId: subscription.id,
          callbackUrl: subscription.callbackUrl,
          status: response.status,
          statusText: response.statusText,
        });
        return;
      }

      loggerService.info("Webhook sent successfully", {
        subscriptionId: subscription.id,
        callbackUrl: subscription.callbackUrl,
        eventType,
      });
    } catch (error) {
      loggerService.error("Error sending webhook", {
        subscriptionId: subscription.id,
        callbackUrl: subscription.callbackUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Wait for all webhooks to be sent (don't fail if some fail)
  await Promise.allSettled(webhookPromises);
}

