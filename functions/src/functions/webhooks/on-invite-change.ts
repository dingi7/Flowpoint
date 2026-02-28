import { sendWebhookFn } from "@/app/webhooks/send-webhook";
import {
  Invite,
  WEBHOOK_EVENT_TYPE,
  WEBHOOK_SUBSCRIPTION_STATUS,
} from "@/core";
import { repositoryHost } from "@/repositories";
import { DatabaseCollection } from "@/repositories/config";
import { serviceHost } from "@/services";
import {
  BILLING_FEATURES,
  checkBilling,
  isBillingRequiredError,
} from "@/utils/check-billing";
import { defineSecret } from "firebase-functions/params";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const webhookSubscriptionRepository =
  repositoryHost.getWebhookSubscriptionRepository(databaseService);

export const onInviteChange = onDocumentWritten(
  {
    document: `${DatabaseCollection.INVITES}/{inviteId}`,
    secrets: [clerkSecretKey],
  },
  async (event) => {
    const beforeData = event.data?.before?.data() as Invite | undefined;
    const afterData = event.data?.after?.data() as Invite | undefined;

    // Get organizationId from the invite data
    const organizationId =
      afterData?.organizationId || beforeData?.organizationId;

    if (!organizationId) {
      loggerService.info("No organizationId found in invite data", {
        inviteId: event.params.inviteId,
      });
      return;
    }

    // Determine event type
    let eventType: WEBHOOK_EVENT_TYPE;
    if (!beforeData && afterData) {
      eventType = WEBHOOK_EVENT_TYPE.INVITE_CREATED;
    } else if (beforeData && !afterData) {
      eventType = WEBHOOK_EVENT_TYPE.INVITE_DELETED;
    } else {
      eventType = WEBHOOK_EVENT_TYPE.INVITE_UPDATED;
    }

    try {
      await checkBilling(
        {
          organizationId,
          requiredFeatureSlugs: [BILLING_FEATURES.webhooks],
        },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );
    } catch (error) {
      if (isBillingRequiredError(error)) {
        loggerService.info("Skipping webhook delivery due to plan access", {
          organizationId,
          eventType,
        });
        return;
      }
      throw error;
    }

    // Get active webhook subscriptions for this organization
    const subscriptions = await webhookSubscriptionRepository.getAll({
      queryConstraints: [
        {
          field: "status",
          operator: "==",
          value: WEBHOOK_SUBSCRIPTION_STATUS.ACTIVE,
        },
      ],
      organizationId,
    });

    if (subscriptions.length === 0) {
      loggerService.info("No active webhook subscriptions found", {
        organizationId,
      });
      return;
    }

    // Send webhook with the appropriate data
    const webhookData = afterData || beforeData;

    if (!webhookData) {
      loggerService.info("No data available for webhook", {
        organizationId,
        eventType,
      });
      return;
    }

    await sendWebhookFn(
      {
        eventType,
        data: webhookData,
        organizationId,
        webhookSubscriptions: subscriptions,
      },
      {
        secretManagerService,
        loggerService,
      },
    );
  },
);
