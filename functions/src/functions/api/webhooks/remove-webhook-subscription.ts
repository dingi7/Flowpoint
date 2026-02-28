import { removeWebhookSubscriptionFn } from "@/app/api/webhooks/remove-webhook-subscription";
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
  subscriptionId: string;
}

export const removeWebhookSubscription = onCall<Payload>(
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

    loggerService.info("Remove webhook subscription request received", {
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

      await removeWebhookSubscriptionFn(
        {
          organizationId: data.organizationId,
          subscriptionId: data.subscriptionId,
        },
        {
          webhookSubscriptionRepository,
          secretManagerService,
          loggerService,
        },
      );

      loggerService.info("Webhook subscription removed successfully", {
        organizationId: data.organizationId,
        subscriptionId: data.subscriptionId,
      });

      return {};
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      loggerService.error("Remove webhook subscription error", error);
      throw new Error(
        `Failed to remove webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
