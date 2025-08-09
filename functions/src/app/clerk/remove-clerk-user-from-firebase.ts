import {
  AuthenticationService,
  ClerkService,
  ClerkUser,
  LoggerService,
  UserRepository,
} from "../../core";

interface Payload {
  clerkUser: ClerkUser;
}

interface Dependencies {
  authenticationService: AuthenticationService;
  clerkService: ClerkService;
  loggerService: LoggerService;
  userRepository: UserRepository;
}
/**
 * Remove user from Firebase Auth and Firestore
 *
 * @param {Payload} payload
 * @param {Dependencies} dependencies
 *
 * @return {Promise<void>}
 */ export async function removeClerkUserFromFirebase(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { clerkUser } = payload;
  const { authenticationService, loggerService, userRepository } = dependencies;

  loggerService.info("Processing Clerk user:", clerkUser);

  if (!clerkUser.id) {
    loggerService.error("Clerk user ID is required");
    throw new Error("Clerk user ID is required");
  }

  try {
    // remove user from firebase
    await authenticationService.deleteUser(clerkUser.id);
  } catch (error) {
    // user already exists, update user in firebase
    loggerService.warn("Error deleting user from Firebase", error);
  }
  loggerService.info("User deleted from Firebase");

  try {
    // remove user from firestore
    await userRepository.delete({
      id: clerkUser.id,
    });
  } catch (error) {
    loggerService.warn("Error deleting user from Firestore", error);
  }

  loggerService.info("User deleted from Firestore");

  loggerService.info("Clerk user removed from Firebase and Firestore");
}
