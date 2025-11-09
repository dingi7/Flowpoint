import {
  ApiKey,
  ApiKeySchema,
  LoggerService,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";
import { randomBytes } from "crypto";

interface Payload {
  userId: string;
  organizationId: string;
  name: string;
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
}

interface CreateApiKeyResult {
  apiKey: string;
  apiKeyMetadata: ApiKey;
}

export async function createApiKeyFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<CreateApiKeyResult> {
  const { userId, organizationId, name } = payload;
  const {
    organizationRepository,
    secretManagerService,
    loggerService,
  } = dependencies;

  loggerService.info("Creating API key", { userId, organizationId, name });

  // 1. Verify organization exists
  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.info("Organization not found", { organizationId });
    throw new Error("Organization not found");
  }


  // 2. Generate random string for secret ID (16-32 alphanumeric characters)
  const randomString = randomBytes(16).toString("base64url").substring(0, 32);
  const secretId = `pk_${organizationId}_${randomString}`;

  // 3. Generate API key (32 bytes = 256 bits, base64 encoded)
  const apiKeyBytes = randomBytes(32);
  const apiKey = apiKeyBytes.toString("base64");

  loggerService.info("Generated API key and secret ID", {
    secretId,
    apiKeyLength: apiKey.length,
  });

  // 4. Store API key in Cloud Secret Manager
  await secretManagerService.createSecret(secretId, apiKey);

  loggerService.info("API key stored in Secret Manager", { secretId });

  // 5. Create API key metadata
  const apiKeyMetadata: ApiKey = ApiKeySchema.parse({
    name,
    secretId,
    createdAt: new Date(),
    status: "active",
    lastFour: apiKey.slice(-4),
  });

  // 6. Add API key metadata to organization
  try {
    await organizationRepository.addToSet({
      id: organizationId,
      fieldName: "apiKeys",
      value: [apiKeyMetadata],
    });
    loggerService.info("API key metadata added to organization", {
      organizationId,
      secretId,
    });
  } catch (error) {
    loggerService.error(
      "Failed to add API key metadata to organization",
      error,
    );
    // Try to clean up the secret if organization update fails
    try {
      await secretManagerService.deleteSecret(secretId);
    } catch (deleteError) {
      loggerService.error("Failed to clean up secret after error", deleteError);
    }
    throw new Error("Failed to create API key");
  }

  return {
    apiKey,
    apiKeyMetadata,
  };
}

