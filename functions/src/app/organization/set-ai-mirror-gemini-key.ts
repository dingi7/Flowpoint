import {
  LandingPageSettingsSchema,
  LoggerService,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";
import { buildAiMirrorSecretId } from "@/utils/ai-mirror";
import z from "zod";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  geminiApiKey: z.string().trim().min(1).max(1024),
});

type Payload = z.infer<typeof payloadSchema>;

interface Dependencies {
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

export async function setAiMirrorGeminiKeyFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<{ hasGeminiKey: boolean }> {
  const validatedPayload = payloadSchema.parse(payload);
  const { organizationRepository, secretManagerService, loggerService } =
    dependencies;

  const organization = await organizationRepository.get({
    id: validatedPayload.organizationId,
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const secretId = buildAiMirrorSecretId({
    organizationId: validatedPayload.organizationId,
  });

  await secretManagerService.createSecret(
    secretId,
    validatedPayload.geminiApiKey,
  );

  await organizationRepository.update({
    id: validatedPayload.organizationId,
    data: {
      landingPage: LandingPageSettingsSchema.parse({
        ...organization.landingPage,
        aiMirror: {
          enabled: organization.landingPage?.aiMirror?.enabled ?? false,
          hasGeminiKey: true,
        },
      }),
    },
  });

  loggerService.info("AI mirror Gemini key stored", {
    organizationId: validatedPayload.organizationId,
    secretId,
  });

  return {
    hasGeminiKey: true,
  };
}
