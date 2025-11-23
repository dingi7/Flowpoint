import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

// Services
import { handleClerkWebhook } from "../../app/clerk/handle-clerk-webhook";
import { Secrets } from "../../config/secrets";
import { serviceHost } from "../../services";

const clerkService = serviceHost.getClerkService();
const loggerService = serviceHost.getLoggerService();
const pubSubService = serviceHost.getPubSubService();

const clerkWebhookSecret = defineSecret(Secrets.CLERK_WEBHOOK_SECRET_PROD);

/**
 * This function is triggered by Clerk Webhook events.
 */
export const onClerkWebhookEventProd = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkWebhookSecret],
  },
  async (request, response) => {
    console.log("request", request);
    console.log("response", response);

    try {
      // get svix headers
      const svixID = request.headers["svix-id"];
      const svixSignature = request.headers["svix-signature"];
      const svixTimestamp = request.headers["svix-timestamp"];

      // log svix headers
      loggerService.info("svix-id", svixID);
      loggerService.info("svix-signature", svixSignature);
      loggerService.info("svix-timestamp", svixTimestamp);

      if (!svixID || !svixSignature || !svixTimestamp) {
        response.status(400).send("Missing headers");
        return;
      }

      await handleClerkWebhook(
        {
          svixID: svixID as string,
          svixSignature: svixSignature as string,
          svixTimestamp: svixTimestamp as string,
          rawBody: request.rawBody,
          clerkWebhookSecret: clerkWebhookSecret.value(),
        },
        {
          clerkService,
          loggerService,
          pubSubService,
        },
      );

      response.status(200).send("OK");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      response.status(400).send("Invalid signature");
      return;
    }
  },
);
