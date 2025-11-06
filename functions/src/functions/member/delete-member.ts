import { deleteMemberFn } from "@/app/member/delete-member";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);
const calendarRepository = repositoryHost.getCalendarRepository(databaseService);

interface Payload {
  userId: string;
  organizationId: string;
}

export const deleteMember = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Delete member request received", {
      data,
    });

    try {
      await deleteMemberFn(
        { userId: data.userId, organizationId: data.organizationId },
        {
          loggerService,
          memberRepository,
          userRepository,
          calendarRepository,
        },
      );

      loggerService.info("Member deleted successfully", {
        userId: data.userId,
        organizationId: data.organizationId,
      });

      return { success: true };
    } catch (error) {
      loggerService.error("Member deletion error", error);
      throw new Error(
        `Member deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

