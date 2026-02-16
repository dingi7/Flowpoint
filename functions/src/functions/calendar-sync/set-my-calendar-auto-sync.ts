import { ensureSelfMemberAccess } from "@/app/calendar-sync/authorization";
import { CALENDAR_SYNC_CONNECTION_STATUS } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const calendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);

interface Payload {
  organizationId: string;
  enabled: boolean;
}

export const setMyCalendarAutoSync = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { organizationId, enabled } = request.data;
    if (!organizationId || typeof enabled !== "boolean") {
      throw new Error("organizationId and enabled are required");
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

    if (!connection || !connection.googleRefreshTokenSecretId) {
      throw new Error("Google Calendar is not connected");
    }

    if (
      enabled &&
      connection.status !== CALENDAR_SYNC_CONNECTION_STATUS.CONNECTED
    ) {
      throw new Error("Google Calendar needs reconnection before enabling sync");
    }

    await calendarSyncConnectionRepository.update({
      organizationId,
      id: memberId,
      data: {
        syncEnabled: enabled,
      },
    });

    return {};
  },
);
