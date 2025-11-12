import { sendWebhookFn } from "@/app/webhooks/send-webhook";
import {
  Invite,
  WEBHOOK_EVENT_TYPE,
  WEBHOOK_SUBSCRIPTION_STATUS,
} from "@/core";
import { repositoryHost } from "@/repositories";
import { DatabaseCollection } from "@/repositories/config";
import { serviceHost } from "@/services";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});
const webhookSubscriptionRepository =
  repositoryHost.getWebhookSubscriptionRepository(databaseService);

export const onInviteChange = onDocumentWritten(
  `${DatabaseCollection.INVITES}/{inviteId}`,
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

