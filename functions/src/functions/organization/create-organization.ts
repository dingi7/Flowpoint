import { createOrganizationFn } from "@/app/organization/create-organization";
import { OrganizationSettingsData } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);
const calendarRepository = repositoryHost.getCalendarRepository(databaseService);

interface Payload {
  name: string;
  image?: string;
  industry?: string;
  currency: string;
  settings: OrganizationSettingsData;
}

export const createOrganization = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Create organization request received", {
      data,
    });

    try {
      const organizationId = await createOrganizationFn(
        { userId: request.auth.uid, organizationData: data },
        {
          loggerService,
          organizationRepository,
          memberRepository,
          roleRepository,
          userRepository,
          calendarRepository,
        },
      );

      loggerService.info("Organization created successfully", {
        organizationId,
      });

      return organizationId;
    } catch (error) {
      loggerService.error("Organization creation error", error);
      throw new Error(
        `Organization creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
