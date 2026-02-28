import z from "zod";
import { baseEntitySchema } from "./base";

export enum CALENDAR_SYNC_CONNECTION_STATUS {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  REAUTH_REQUIRED = "reauth_required",
  ERROR = "error",
}

export enum CALENDAR_SYNC_BACKFILL_STATUS {
  IDLE = "idle",
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export const calendarSyncConnectionDataSchema = z.object({
  organizationId: z.string(),
  memberId: z.string(),
  userId: z.string(),
  syncEnabled: z.boolean().default(false),
  status: z.nativeEnum(CALENDAR_SYNC_CONNECTION_STATUS),
  googleCalendarId: z.literal("primary").default("primary"),
  googleRefreshTokenSecretId: z.string().optional(),
  googleAccountEmail: z.string().email().optional(),
  icsTokenHash: z.string().optional(),
  icsTokenSecretId: z.string().optional(),
  appBaseUrl: z.string().url().optional(),
  backfillStatus: z
    .nativeEnum(CALENDAR_SYNC_BACKFILL_STATUS)
    .default(CALENDAR_SYNC_BACKFILL_STATUS.IDLE),
  lastSyncedAt: z.date().optional(),
  lastError: z.string().optional(),
});

export type CalendarSyncConnectionData = z.infer<
  typeof calendarSyncConnectionDataSchema
>;

export const calendarSyncConnectionSchema = baseEntitySchema.merge(
  calendarSyncConnectionDataSchema,
);

export type CalendarSyncConnection = z.infer<typeof calendarSyncConnectionSchema>;
