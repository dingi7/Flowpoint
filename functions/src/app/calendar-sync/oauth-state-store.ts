import { firestore } from "@/infrastructure/firebase";

const OAUTH_STATE_COLLECTION = "calendar-sync-oauth-states";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface CalendarSyncOAuthState {
  state: string;
  organizationId: string;
  userId: string;
  memberId: string;
  returnUrl: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export async function createCalendarSyncOAuthState(
  payload: Omit<CalendarSyncOAuthState, "createdAt" | "expiresAt" | "used">,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OAUTH_STATE_TTL_MS);

  await firestore.collection(OAUTH_STATE_COLLECTION).doc(payload.state).set({
    ...payload,
    createdAt: now,
    expiresAt,
    used: false,
  });
}

export async function consumeCalendarSyncOAuthState(
  state: string,
): Promise<CalendarSyncOAuthState | null> {
  const ref = firestore.collection(OAUTH_STATE_COLLECTION).doc(state);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as
    | (Omit<CalendarSyncOAuthState, "createdAt" | "expiresAt"> & {
        createdAt: Date | { toDate: () => Date };
        expiresAt: Date | { toDate: () => Date };
      })
    | undefined;

  if (!data) {
    return null;
  }

  const createdAt =
    data.createdAt instanceof Date
      ? data.createdAt
      : data.createdAt.toDate();
  const expiresAt =
    data.expiresAt instanceof Date
      ? data.expiresAt
      : data.expiresAt.toDate();

  if (data.used || expiresAt.getTime() < Date.now()) {
    return null;
  }

  await ref.update({
    used: true,
  });

  return {
    ...data,
    createdAt,
    expiresAt,
  };
}
