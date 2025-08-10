import { createClerkClient, WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

import { ClerkService, USER_EVENT } from "@/core";

export const clerkService: ClerkService = {
  async validateWebhookSignature(payload) {
    const wh = new Webhook(payload.webhookSecret);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload.rawBody, {
        "svix-id": payload.svixID,
        "svix-timestamp": payload.svixTimestamp,
        "svix-signature": payload.svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return null;
    }

    return evt;
  },

  async createClerkUser(payload) {
    try {
      const clerkClient = createClerkClient({
        secretKey: payload.apiKey,
      });

      return clerkClient.users.createUser({
        firstName: payload.firstName,
        lastName: payload.lastName,
        emailAddress: [payload.email],
        privateMetadata: payload.privateMetadata,
        publicMetadata: payload.publicMetadata,
        unsafeMetadata: payload.unsafeMetadata,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  createClerkInvitation(payload) {
    try {
      const clerkClient = createClerkClient({
        secretKey: payload.apiKey,
      });

      return clerkClient.invitations.createInvitation({
        emailAddress: payload.email,
        ignoreExisting: true,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  getClerkUserFromEvent(event) {
    switch (event.type) {
      case USER_EVENT.USER_CREATED:
        return event.data;
      case USER_EVENT.USER_UPDATED:
        return event.data;
      case USER_EVENT.USER_DELETED:
        return event.data;
      default:
        return null;
    }
  },

  async deleteClerkUser(payload) {
    try {
      const clerkClient = createClerkClient({
        secretKey: payload.apiKey,
      });

      await clerkClient.users.deleteUser(payload.clerkUserID);
    } catch (error) {
      console.error(error);
    }
  },
};
