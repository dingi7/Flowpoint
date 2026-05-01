import { setAiMirrorGeminiKeyFn } from "@/app/organization/set-ai-mirror-gemini-key";
import { PermissionKey } from "@/core";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { BILLING_FEATURES } from "@/utils/check-billing";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";

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

interface Payload {
  organizationId: string;
  geminiApiKey: string;
}

export const setAiMirrorGeminiKey = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    try {
      await checkPermission(
        {
          userId: request.auth.uid,
          organizationId: request.data.organizationId,
          permission: PermissionKey.MANAGE_ORGANIZATION,
          requiredFeatureSlugs: [BILLING_FEATURES.landingPage],
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

      return await setAiMirrorGeminiKeyFn(request.data, {
        organizationRepository,
        secretManagerService,
        loggerService,
      });
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      loggerService.error("Set AI mirror Gemini key error", error);
      throw new Error(
        `Failed to save AI mirror Gemini key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
);
