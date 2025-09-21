import { createOrganizationInviteFn } from "@/app/invite/create-organization-invite";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const inviteRepository = repositoryHost.getInviteRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);

interface Payload {
  organizationId: string;
  inviteeEmail: string;
  inviteeRoleIds: string[];
  validFor?: number;
}

export const createOrganizationInvite = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Create invite request received", {
      data,
    });

    try {
      const invite = await createOrganizationInviteFn(
        { inviterId: request.auth.uid, ...data },
        {
          loggerService,
          inviteRepository,
          memberRepository,
          roleRepository,
        },
      );

      loggerService.info("Invite created successfully", {
        invite: invite,
      });

      return invite;
    } catch (error) {
      loggerService.error("Invite creation error", error);
      throw new Error(
        `Invite creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
