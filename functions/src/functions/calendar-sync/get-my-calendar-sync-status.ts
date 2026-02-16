import { ensureSelfMemberAccess } from "@/app/calendar-sync/authorization";
import {
  mapConnectionToStatusResponse,
  CalendarSyncStatusResponse,
} from "@/app/calendar-sync/connection-utils";
import { getFunctionUrl } from "@/app/calendar-sync/function-url";
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

export const getMyCalendarSyncStatus = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request): Promise<CalendarSyncStatusResponse> => {
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

    const statusResponse = mapConnectionToStatusResponse(connection);

    if (connection?.icsTokenSecretId) {
      const rawIcsToken = await secretManagerService.getSecret(
        connection.icsTokenSecretId,
      );
      if (rawIcsToken) {
        const icsUrl = new URL(getFunctionUrl("memberCalendarIcsFeed"));
        icsUrl.searchParams.set("organizationId", organizationId);
        icsUrl.searchParams.set("memberId", memberId);
        icsUrl.searchParams.set("token", rawIcsToken);
        statusResponse.appleIcsUrl = icsUrl.toString();
      }
    }

    return statusResponse;
  },
);
