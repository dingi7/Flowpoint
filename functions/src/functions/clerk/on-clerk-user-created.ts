import { onMessagePublished } from "firebase-functions/v2/pubsub";

import { createClerkUserInFirebase } from "../../app/clerk/create-clerk-user-in-firebase";
import { PUB_SUB_TOPICS } from "../../config/pub-sub";
import { ClerkUser } from "../../core";
import { repositoryHost } from "../../repositories";
import { serviceHost } from "../../services";

const authenticationService = serviceHost.getAuthenticationService();
const loggerService = serviceHost.getLoggerService();
const databaseService = serviceHost.getDatabaseService();
const userRepository = repositoryHost.getUserRepository(databaseService);

/**
 * This function is triggered by a message published to the `clerk-user-created` topic.
 */
export const onClerkUserCreated = onMessagePublished<ClerkUser>(
  {
    topic: PUB_SUB_TOPICS.CLERK_USER_CREATED,
  },
  async (message) => {
    loggerService.debug("message", message);

    try {
      await createClerkUserInFirebase(
        {
          clerkUser: message.data.message.json,
        },
        {
          authenticationService,
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
