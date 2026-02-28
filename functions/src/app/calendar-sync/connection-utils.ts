import {
  CALENDAR_SYNC_BACKFILL_STATUS,
  CALENDAR_SYNC_CONNECTION_STATUS,
  CalendarSyncConnection,
  CalendarSyncConnectionData,
} from "@/core";

export interface CalendarSyncStatusResponse {
  connected: boolean;
  syncEnabled: boolean;
  status: CALENDAR_SYNC_CONNECTION_STATUS | "disconnected";
  googleAccountEmail?: string;
  appleIcsUrl?: string;
  backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS;
  lastError?: string;
}

export function buildDefaultCalendarSyncConnectionData(
  payload: {
    organizationId: string;
    memberId: string;
    userId: string;
  },
): CalendarSyncConnectionData {
  return {
    organizationId: payload.organizationId,
    memberId: payload.memberId,
    userId: payload.userId,
    syncEnabled: false,
    status: CALENDAR_SYNC_CONNECTION_STATUS.DISCONNECTED,
    googleCalendarId: "primary",
    backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.IDLE,
  };
}

export function mapConnectionToStatusResponse(
  connection: CalendarSyncConnection | null,
): CalendarSyncStatusResponse {
  if (!connection) {
    return {
      connected: false,
      syncEnabled: false,
      status: "disconnected",
      backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.IDLE,
    };
  }

  return {
    connected: connection.status === CALENDAR_SYNC_CONNECTION_STATUS.CONNECTED,
    syncEnabled: connection.syncEnabled,
    status: connection.status,
    googleAccountEmail: connection.googleAccountEmail,
    backfillStatus: connection.backfillStatus,
    lastError: connection.lastError,
  };
}
