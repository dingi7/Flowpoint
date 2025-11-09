import { createApiKeyFn } from "@/app/organization/create-api-key";
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
  name: string;
}

export const createApiKey = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Create API key request received", {
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

      const result = await createApiKeyFn(
        {
          userId: request.auth.uid,
          organizationId: data.organizationId,
          name: data.name,
        },
        {
          organizationRepository,
          secretManagerService,
          loggerService,
        },
      );

      loggerService.info("API key created successfully", {
        organizationId: data.organizationId,
        secretId: result.apiKeyMetadata.secretId,
      });

      return result
    } catch (error) {
      loggerService.error("Create API key error", error);
      throw new Error(
        `API key creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

