import { revokeApiKeyFn } from "@/app/organization/revoke-api-key";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, onCall } from "firebase-functions/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);

interface Payload {
  organizationId: string;
  secretId: string;
}

export const revokeApiKey = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Revoke API key request received", {
      data,
    });

    try {
      // Check permission
      await checkPermission(
        request.auth.uid,
        data.organizationId,
        PermissionKey.MANAGE_ORGANIZATION,
        {
          memberRepository,
          roleRepository,
          loggerService,
        },
      );

      await revokeApiKeyFn(
        {
          organizationId: data.organizationId,
          secretId: data.secretId,
        },
        {
          organizationRepository,
          secretManagerService,
          loggerService,
        },
      );

      loggerService.info("API key revoked successfully", {
        organizationId: data.organizationId,
        secretId: data.secretId,
      });
    } catch (error) {
      loggerService.error("Revoke API key error", error);
      throw new Error(
        `Failed to revoke API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

