import { ensureSelfMemberAccess } from "@/app/calendar-sync/authorization";
import {
  CALENDAR_SYNC_BACKFILL_STATUS,
  CALENDAR_SYNC_CONNECTION_STATUS,
} from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const calendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

interface Payload {
  organizationId: string;
}

export const disconnectMyCalendarSync = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { organizationId } = request.data;
    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    const memberId = await ensureSelfMemberAccess(
      {
        userId: request.auth.uid,
        organizationId,
      },
      { memberRepository },
    );

    const connection = await calendarSyncConnectionRepository.get({
      organizationId,
      id: memberId,
    });

    if (!connection) {
      return {};
    }

    if (connection.googleRefreshTokenSecretId) {
      await secretManagerService
        .deleteSecret(connection.googleRefreshTokenSecretId)
        .catch(() => undefined);
    }
    if (connection.icsTokenSecretId) {
      await secretManagerService
        .deleteSecret(connection.icsTokenSecretId)
        .catch(() => undefined);
    }

    await calendarSyncConnectionRepository.update({
      organizationId,
      id: memberId,
      data: {
        syncEnabled: false,
        status: CALENDAR_SYNC_CONNECTION_STATUS.DISCONNECTED,
        backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.IDLE,
        googleRefreshTokenSecretId: undefined,
        googleAccountEmail: undefined,
        icsTokenHash: undefined,
        icsTokenSecretId: undefined,
        lastError: "",
      },
    });

    return {};
  },
);
