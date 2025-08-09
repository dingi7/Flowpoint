import { PUB_SUB_TOPICS } from "../../config/pub-sub";
import {
  ClerkService,
  LoggerService,
  PubSubService,
  USER_EVENT,
} from "../../core";

interface Payload {
  svixID: string;
  svixSignature: string;
  svixTimestamp: string;
  rawBody: Buffer;
  clerkWebhookSecret: string;
}

interface Dependencies {
  clerkService: ClerkService;
  loggerService: LoggerService;
  pubSubService: PubSubService;
}

export async function handleClerkWebhook(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { svixID, svixSignature, svixTimestamp, rawBody, clerkWebhookSecret } =
    payload;
  const { clerkService, loggerService, pubSubService } = dependencies;

  loggerService.info("Processing Clerk webhook event:", payload);

  if (!clerkWebhookSecret) {
    throw new Error("Clerk webhook secret not found");
  }

  // Verify the payload with the headers
  const webhookEvent = await clerkService.validateWebhookSignature({
    rawBody,
    svixID,
    svixTimestamp,
    svixSignature,
    webhookSecret: clerkWebhookSecret,
  });
  if (!webhookEvent) {
    throw new Error("Invalid Clerk webhook event");
  }

  loggerService.info("Clerk webhook event:", webhookEvent);

  // Parse event type
  const clerkUser = clerkService.getClerkUserFromEvent(webhookEvent);
  if (!clerkUser) {
    throw new Error("Invalid Clerk user");
  }

  loggerService.info("Clerk user:", clerkUser);

  // Publish event and Clerk user to PubSub
  switch (webhookEvent.type) {
    case USER_EVENT.USER_CREATED:
      await pubSubService.publish(PUB_SUB_TOPICS.CLERK_USER_CREATED, clerkUser);
      loggerService.info(
        "Clerk user created event published",
        PUB_SUB_TOPICS.CLERK_USER_CREATED,
        clerkUser,
      );
      break;

    case USER_EVENT.USER_DELETED:
      await pubSubService.publish(PUB_SUB_TOPICS.CLERK_USER_DELETED, clerkUser);
      loggerService.info(
        "Clerk user deleted event published",
        PUB_SUB_TOPICS.CLERK_USER_DELETED,
        clerkUser,
      );
      break;
  }
}
