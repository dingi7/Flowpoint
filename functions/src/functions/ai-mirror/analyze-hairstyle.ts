import { analyzeHairstyleFn } from "@/app/ai-mirror/analyze-hairstyle";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import {
  BILLING_FEATURES,
  checkBilling,
  isBillingRequiredError,
} from "@/utils/check-billing";
import { buildAiMirrorSecretId } from "@/utils/ai-mirror";
import { HttpsError } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { onCall } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);

interface Payload {
  organizationId: string;
  imageDataUrl: string;
  locale: "en" | "bg" | "tr";
}

export const analyzeHairstyle = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
    memory: "512MiB",
    timeoutSeconds: 180,
  },
  async (request) => {
    try {
      await checkBilling(
        {
          organizationId: request.data.organizationId,
          requiredFeatureSlugs: [BILLING_FEATURES.landingPage],
        },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );

      const organization = await organizationRepository.get({
        id: request.data.organizationId,
      });

      if (!organization?.landingPage?.aiMirror?.enabled) {
        throw new HttpsError(
          "failed-precondition",
          "AI mirror is not enabled for this organization",
        );
      }

      if (!organization.landingPage.aiMirror.hasGeminiKey) {
        throw new HttpsError(
          "failed-precondition",
          "AI mirror is missing a Gemini API key",
        );
      }

      const apiKey = await secretManagerService.getSecret(
        buildAiMirrorSecretId({
          organizationId: request.data.organizationId,
        }),
      );

      if (!apiKey) {
        throw new HttpsError(
          "failed-precondition",
          "AI mirror Gemini API key is not configured",
        );
      }

      const genkitService = apiKey
        ? serviceHost.getGenkitService({ apiKey })
        : undefined;

      const analysis = await analyzeHairstyleFn(request.data, {
        genkitService,
        loggerService,
        serviceRepository,
      });

      return {
        success: true,
        ...analysis,
      };
    } catch (error) {
      if (error instanceof HttpsError || isBillingRequiredError(error)) {
        throw error;
      }

      loggerService.error("Analyze hairstyle error", error);
      throw new HttpsError("internal", "Failed to analyze hairstyle");
    }
  },
);
