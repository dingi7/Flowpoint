import { onMessagePublished } from "firebase-functions/v2/pubsub";

import { removeClerkUserFromFirebase } from "@/app/clerk/remove-clerk-user-from-firebase";
import { PUB_SUB_TOPICS } from "@/config/pub-sub";
import { ClerkUser } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";

const authenticationService = serviceHost.getAuthenticationService();
const clerkService = serviceHost.getClerkService();
const loggerService = serviceHost.getLoggerService();
const databaseService = serviceHost.getDatabaseService();
const userRepository = repositoryHost.getUserRepository(databaseService);

/**
 * This function is triggered by a message published to the `clerk-user-created` topic.
 */
export const onClerkUserDeleted = onMessagePublished<ClerkUser>(
  {
    topic: PUB_SUB_TOPICS.CLERK_USER_DELETED,
  },
  async (message) => {
    loggerService.debug("message", message);

    try {
      await removeClerkUserFromFirebase(
        {
          clerkUser: message.data.message.json,
        },
        {
          authenticationService,
          clerkService,
          loggerService,
          userRepository,
        },
      );
    } catch (err) {
      loggerService.error("Error creating Clerk user in Firebase:", err);
      throw err;
    }
  },
);
