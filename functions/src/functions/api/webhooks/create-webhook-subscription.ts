import { createWebhookSubscriptionFn } from "@/app/api/webhooks/create-webhook-subscription";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { BILLING_FEATURES } from "@/utils/check-billing";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const webhookSubscriptionRepository =
  repositoryHost.getWebhookSubscriptionRepository(databaseService);

interface Payload {
  organizationId: string;
  eventTypes: string[];
  callbackUrl: string;
}

export const createWebhookSubscription = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Create webhook subscription request received", {
      data,
    });

    try {
      // Check permission
      await checkPermission(
        {
          userId: request.auth.uid,
          organizationId: data.organizationId,
          permission: PermissionKey.MANAGE_ORGANIZATION,
          requiredFeatureSlugs: [BILLING_FEATURES.webhooks],
        },
        {
          memberRepository,
          roleRepository,
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );

      const result = await createWebhookSubscriptionFn(
        {
          organizationId: data.organizationId,
          eventTypes: data.eventTypes,
          callbackUrl: data.callbackUrl,
        },
        {
          webhookSubscriptionRepository,
          secretManagerService,
          loggerService,
        },
      );

      loggerService.info("Webhook subscription created successfully", {
        organizationId: data.organizationId,
        subscriptionId: result.webhookSubscription.id,
      });

      return {
        webhookSubscription: {
          id: result.webhookSubscription.id,
          eventTypes: result.webhookSubscription.eventTypes,
          callbackUrl: result.webhookSubscription.callbackUrl,
          status: result.webhookSubscription.status,
          createdAt: result.webhookSubscription.createdAt,
          updatedAt: result.webhookSubscription.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      loggerService.error("Create webhook subscription error", error);
      throw new Error(
        `Failed to create webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
