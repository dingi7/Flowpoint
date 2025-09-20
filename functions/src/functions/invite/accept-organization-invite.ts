import { acceptOrganizationInviteFn } from "@/app/invite/accept-organization-invite";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const inviteRepository = repositoryHost.getInviteRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);

interface Payload {
  inviteId: string;
  name: string;
  image?: string;
  description?: string;
}

export const acceptOrganizationInvite = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Accept invite request received", {
      data,
    });

    try {
      await acceptOrganizationInviteFn(
        { userId: request.auth.uid, ...data },
        {
          loggerService,
          inviteRepository,
          memberRepository,
          userRepository,
        },
      );

      return;
    } catch (error) {
      loggerService.error("Invite accept error", error);
      throw new Error(
        `Invite accept failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
