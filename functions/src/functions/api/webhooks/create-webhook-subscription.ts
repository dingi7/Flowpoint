import { createWebhookSubscriptionFn } from "@/app/api/webhooks/create-webhook-subscription";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
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
        },
        {
          memberRepository,
          roleRepository,
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
      loggerService.error("Create webhook subscription error", error);
      throw new Error(
        `Failed to create webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

