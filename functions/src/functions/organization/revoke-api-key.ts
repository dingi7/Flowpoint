import { revokeApiKeyFn } from "@/app/organization/revoke-api-key";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { BILLING_FEATURES } from "@/utils/check-billing";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const apiKeyHashRepository =
  repositoryHost.getApiKeyHashRepository(databaseService);

interface Payload {
  organizationId: string;
  secretId: string;
}

export const revokeApiKey = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
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
        {
          userId: request.auth.uid,
          organizationId: data.organizationId,
          permission: PermissionKey.MANAGE_ORGANIZATION,
          requiredFeatureSlugs: [BILLING_FEATURES.api],
        },
        {
          memberRepository,
          roleRepository,
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
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
          apiKeyHashRepository,
          loggerService,
        },
      );

      loggerService.info("API key revoked successfully", {
        organizationId: data.organizationId,
        secretId: data.secretId,
      });
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      loggerService.error("Revoke API key error", error);
      throw new Error(
        `Failed to revoke API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
