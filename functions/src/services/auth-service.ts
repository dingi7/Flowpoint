import { AuthenticationService, AuthUser } from "@/core";
import { auth } from "@/infrastructure/firebase";

export const authService: AuthenticationService = {
  async createUser(payload): Promise<void> {
    await auth.createUser(payload);
  },
  async updateUser(payload): Promise<void> {
    if (!payload.uid) {
      throw new Error("User ID is required");
    }

    await auth.updateUser(payload.uid, payload);
  },
  async getUserByID(id): Promise<AuthUser | null> {
    const userRecord = await auth.getUser(id);

    if (!userRecord) {
      return null;
    }

    return {
      uid: userRecord.uid,
      email: userRecord.email ?? "",
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
    };
  },

  async getUserByEmail(email): Promise<AuthUser | null> {
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return null;
    }

    return {
      uid: userRecord.uid,
      email: userRecord.email ?? "",
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
    };
  },

  async deleteUser(id): Promise<void> {
    await auth.deleteUser(id);
  },
};
