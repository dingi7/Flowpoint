import {
  AuthenticationService,
  ClerkUser,
  LoggerService,
  UserRepository,
} from "@/core";

interface Payload {
  clerkUser: ClerkUser;
  roles?: string[];
}

interface Dependencies {
  authenticationService: AuthenticationService;
  loggerService: LoggerService;
  userRepository: UserRepository;
}

/**
 * Create user in Firebase Auth
 *
 * @param {Payload} payload
 * @param {Dependencies} dependencies
 *
 * @return {Promise<void>}
 */
export async function createClerkUserInFirebase(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { clerkUser, roles } = payload;
  const { authenticationService, loggerService, userRepository } = dependencies;

  loggerService.info("Processing Clerk user:", clerkUser);
  loggerService.info("User roles:", roles);

  // check if clerk user has an email address
  if (clerkUser.email_addresses.length === 0) {
    throw new Error("Clerk user doesn't have an email address");
  }

  // get clerk user email address
  const clerkUserEmail = clerkUser.email_addresses[0].email_address;
  loggerService.info(`Clerk user email: ${clerkUserEmail}`);

  let displayName = "";

  if (clerkUser.first_name && clerkUser.last_name) {
    displayName = `${clerkUser.first_name} ${clerkUser.last_name}`;
  }

  type UserMetadataInput = {
    roles?: string[];
  };

  type PrivateMetadata = {
    user: UserMetadataInput;
  };

  let privateMetadata: PrivateMetadata = {} as PrivateMetadata;

  let userData = {
    uid: clerkUser.id,
    email: clerkUserEmail,
    displayName,
  };

  if (clerkUser.private_metadata as PrivateMetadata) {
    privateMetadata = clerkUser.private_metadata as PrivateMetadata;

    if (privateMetadata.user) {
      userData = {
        ...userData,
        ...privateMetadata.user,
      };
    }
  }

  loggerService.info(
    `Clerk user private metadata: ${JSON.stringify(privateMetadata)}`,
  );

  try {
    // create user in firebase
    await authenticationService.createUser({
      uid: clerkUser.id,
      email: clerkUserEmail,
      displayName,
    });
  } catch (error) {
    // Check if error is due to user already existing
    if (error instanceof Error && error.message.includes("already exists")) {
      loggerService.warn("User already exists in Firebase, updating instead");

      try {
        await authenticationService.updateUser({
          ...userData,
        });
        loggerService.info("User updated in Firebase");
      } catch (updateError) {
        loggerService.error(
          "Failed to update existing user in Firebase:",
          updateError,
        );
        throw new Error(
          `Failed to update existing user: ${updateError instanceof Error ? updateError.message : "Unknown error"}`,
        );
      }
    } else {
      loggerService.error("Failed to create user in Firebase:", error);
      throw new Error(
        `Failed to create user in Firebase: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // create user in firestore
  await userRepository.set({
    id: clerkUser.id,
    data: {
      email: clerkUserEmail,
      organizationIds: [],
      roles: roles ?? [],
    },
  });

  loggerService.info("User set in Firestore", clerkUser.id);
}
