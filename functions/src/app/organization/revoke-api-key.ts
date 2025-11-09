import {
  LoggerService,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";

interface Payload {
  organizationId: string;
  secretId: string;
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

export async function revokeApiKeyFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, secretId } = payload;
  const { organizationRepository, secretManagerService, loggerService } =
    dependencies;

  loggerService.info("Revoking API key", { organizationId, secretId });

  // 1. Get organization
  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.info("Organization not found", { organizationId });
    throw new Error("Organization not found");
  }

  // 2. Verify API key exists and belongs to organization
  const apiKeys = organization.apiKeys || [];
  const apiKeyIndex = apiKeys.findIndex((key) => key.secretId === secretId);

  if (apiKeyIndex === -1) {
    loggerService.info("API key not found", { organizationId, secretId });
    throw new Error("API key not found");
  }

  const apiKey = apiKeys[apiKeyIndex];

  if (apiKey.status === "revoked") {
    loggerService.info("API key already revoked", { organizationId, secretId });
    throw new Error("API key already revoked");
  }

  // 3. Delete secret from Cloud Secret Manager

  await secretManagerService.deleteSecret(secretId);
  loggerService.info("API key deleted from Secret Manager", { secretId });

  // 4. Update API key status to "revoked" in organization document
  const updatedApiKeys = [...apiKeys];
  updatedApiKeys[apiKeyIndex] = {
    ...apiKey,
    status: "revoked",
  };

  await organizationRepository.update({
    id: organizationId,
    data: {
      apiKeys: updatedApiKeys,
    },
  });
  loggerService.info("API key status updated to revoked", {
    organizationId,
    secretId,
  });
}
