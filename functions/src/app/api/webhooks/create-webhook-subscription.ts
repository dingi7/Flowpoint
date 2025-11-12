import {
  LoggerService,
  SecretManagerService,
  WebhookSubscription,
  WebhookSubscriptionData,
  WebhookSubscriptionRepository,
  WEBHOOK_SUBSCRIPTION_STATUS,
} from "@/core";
import { randomBytes } from "crypto";
import z from "zod";

interface Payload {
  organizationId: string;
  eventTypes: string[];
  callbackUrl: string;
}

interface Dependencies {
  webhookSubscriptionRepository: WebhookSubscriptionRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

interface CreateWebhookSubscriptionResult {
  webhookSubscription: WebhookSubscription;
}

const createWebhookSubscriptionRequestSchema = z.object({
  eventTypes: z.array(z.string()).min(1),
  callbackUrl: z.string().url(),
});

export async function createWebhookSubscriptionFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<CreateWebhookSubscriptionResult> {
  const { organizationId, eventTypes, callbackUrl } = payload;
  const {
    webhookSubscriptionRepository,
    secretManagerService,
    loggerService,
  } = dependencies;

  loggerService.info("Creating webhook subscription", {
    organizationId,
    eventTypes,
    callbackUrl,
  });

  // 1. Validate request payload
  const validationResult = createWebhookSubscriptionRequestSchema.safeParse({
    eventTypes,
    callbackUrl,
  });

  if (!validationResult.success) {
    loggerService.info("Invalid webhook subscription request", {
      errors: validationResult.error.errors,
    });
    throw new Error("Invalid request data");
  }

  // 2. Generate random string for secret ID
  const randomString = randomBytes(16).toString("base64url").substring(0, 32);
  const secretId = `wh_${organizationId}_${randomString}`;

  // 3. Generate webhook secret (32 bytes = 256 bits, base64 encoded)
  const secretBytes = randomBytes(32);
  const secret = secretBytes.toString("base64");

  loggerService.info("Generated webhook secret and secret ID", {
    secretId,
    secretLength: secret.length,
  });

  // 4. Store secret in Cloud Secret Manager
  try {
    await secretManagerService.createSecret(secretId, secret);
    loggerService.info("Webhook secret stored in Secret Manager", { secretId });
  } catch (error) {
    loggerService.error("Failed to store webhook secret in Secret Manager", error);
    throw new Error("Failed to create webhook subscription");
  }

  // 5. Send secret to callback URL
  try {
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret,
        eventTypes,
      }),
    });

    if (!response.ok) {
      loggerService.info("Failed to send secret to callback URL", {
        callbackUrl,
        status: response.status,
        statusText: response.statusText,
      });
      // Clean up secret if callback fails
      try {
        await secretManagerService.deleteSecret(secretId);
      } catch (deleteError) {
        loggerService.error("Failed to clean up secret after callback error", deleteError);
      }
      throw new Error("Failed to send secret to callback URL");
    }

    loggerService.info("Secret sent to callback URL successfully", {
      callbackUrl,
      status: response.status,
    });
  } catch (error) {
    loggerService.error("Error sending secret to callback URL", error);
    // Clean up secret if callback fails
    try {
      await secretManagerService.deleteSecret(secretId);
    } catch (deleteError) {
      loggerService.error("Failed to clean up secret after callback error", deleteError);
    }
    throw new Error("Failed to send secret to callback URL");
  }

  // 6. Create webhook subscription data
  const webhookSubscriptionData: WebhookSubscriptionData = {
    eventTypes: eventTypes as any[], // Type assertion needed due to enum
    callbackUrl,
    secretId,
    status: WEBHOOK_SUBSCRIPTION_STATUS.ACTIVE,
  };

  // 7. Store webhook subscription in Firestore
  let webhookSubscription: WebhookSubscription;
  try {
    const subscriptionId = await webhookSubscriptionRepository.create({
      data: webhookSubscriptionData,
      organizationId,
    });
    
    // Fetch the created subscription to get the full entity
    const createdSubscription = await webhookSubscriptionRepository.get({
      id: subscriptionId,
      organizationId,
    });
    
    if (!createdSubscription) {
      throw new Error("Failed to retrieve created webhook subscription");
    }
    
    webhookSubscription = createdSubscription;
    
    loggerService.info("Webhook subscription created", {
      organizationId,
      subscriptionId: webhookSubscription.id,
    });
  } catch (error) {
    loggerService.error("Failed to create webhook subscription in Firestore", error);
    // Clean up secret if subscription creation fails
    try {
      await secretManagerService.deleteSecret(secretId);
    } catch (deleteError) {
      loggerService.error("Failed to clean up secret after subscription creation error", deleteError);
    }
    throw new Error("Failed to create webhook subscription");
  }

  return {
    webhookSubscription,
  };
}

