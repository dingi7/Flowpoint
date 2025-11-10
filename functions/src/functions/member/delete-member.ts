import { kickOrganizationMemberFn } from "@/app/member/delete-member";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);
const calendarRepository = repositoryHost.getCalendarRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);

interface Payload {
  memberId: string;
  organizationId: string;
}

export const kickOrganizationMember = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Kick organization member request received", {
      data,
    });

    try {
      await checkPermission(
        {
          userId: request.auth.uid,
          organizationId: data.organizationId,
          permission: PermissionKey.MANAGE_MEMBERS,
        },
        {
          memberRepository,
          roleRepository,
          loggerService,
        },
      );
      await kickOrganizationMemberFn(
        { initiatorId: request.auth.uid, ...data },
        {
          loggerService,
          memberRepository,
          userRepository,
          calendarRepository,
        },
      );

      loggerService.info("Kick organization member successful", {
        memberId: data.memberId,
        organizationId: data.organizationId,
      });

      return { success: true };
    } catch (error) {
      loggerService.error("Kick organization member error", error);
      throw new Error(
        `Kick organization member failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

