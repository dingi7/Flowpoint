import { sendWebhookFn } from "@/app/webhooks/send-webhook";
import {
  Service,
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

export const onServiceChange = onDocumentWritten(
  `organizations/{organizationId}/${DatabaseCollection.SERVICES}/{serviceId}`,
  async (event) => {
    const { organizationId } = event.params;
    const beforeData = event.data?.before?.data() as Service | undefined;
    const afterData = event.data?.after?.data() as Service | undefined;

    // Determine event type
    let eventType: WEBHOOK_EVENT_TYPE;
    if (!beforeData && afterData) {
      eventType = WEBHOOK_EVENT_TYPE.SERVICE_CREATED;
    } else if (beforeData && !afterData) {
      eventType = WEBHOOK_EVENT_TYPE.SERVICE_DELETED;
    } else {
      eventType = WEBHOOK_EVENT_TYPE.SERVICE_UPDATED;
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

