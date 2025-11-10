import {
  ApiKey,
  ApiKeyHashRepository,
  LoggerService,
  Organization,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";
import { createHash, timingSafeEqual } from "crypto";

interface Payload {
  apiKey: string;
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  apiKeyHashRepository: ApiKeyHashRepository;
  loggerService: LoggerService;
}

interface ValidationResult {
  organization: Organization;
  apiKeyMetadata: ApiKey;
}

export async function validateApiKey(
  payload: Payload,
  dependencies: Dependencies,
): Promise<ValidationResult> {
  const { apiKey } = payload;
  const {
    organizationRepository,
    secretManagerService,
    apiKeyHashRepository,
    loggerService,
  } = dependencies;

  loggerService.info("Validating API key", {
    apiKeyLength: apiKey.length,
  });

  // 1. Hash the provided API key
  const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");

  loggerService.info("Generated API key hash for lookup", {
    hashLength: apiKeyHash.length,
  });

  // 2. Look up the hash mapping to get secretId and organizationId
  const hashMapping = await apiKeyHashRepository.get({
    id: apiKeyHash,
  });

  if (!hashMapping) {
    loggerService.info("API key hash not found in mapping", {
      hash: apiKeyHash,
    });
    throw new Error("Invalid API key");
  }

  const { secretId, organizationId } = hashMapping;

  loggerService.info("Found hash mapping", {
    secretId,
    organizationId,
  });

  // 3. Get organization
  const organization = await organizationRepository.get({
    id: organizationId,
  });

  if (!organization) {
    loggerService.info("Organization not found", { organizationId });
    throw new Error("Invalid API key");
  }

  // 4. Find API key metadata
  const apiKeys = organization.apiKeys || [];
  const apiKeyMetadata = apiKeys.find(
    (key) => key.secretId === secretId,
  );

  if (!apiKeyMetadata) {
    loggerService.info("API key metadata not found", {
      organizationId,
      secretId,
    });
    throw new Error("Invalid API key");
  }

  // 5. Check if API key is revoked
  if (apiKeyMetadata.status !== "active") {
    loggerService.info("API key is revoked", {
      organizationId,
      secretId,
      status: apiKeyMetadata.status,
    });
    throw new Error("API key has been revoked");
  }

  // 6. Retrieve stored API key from Secret Manager
  const storedApiKey = await secretManagerService.getSecret(secretId);

  if (!storedApiKey) {
    loggerService.info("API key not found in Secret Manager", { secretId });
    throw new Error("Invalid API key");
  }

  // 7. Compare provided API key with stored API key
  // Use timing-safe comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey, "utf8");
  const storedApiKeyBuffer = Buffer.from(storedApiKey, "utf8");

  if (
    apiKeyBuffer.length !== storedApiKeyBuffer.length ||
    !timingSafeEqual(apiKeyBuffer, storedApiKeyBuffer)
  ) {
    loggerService.info("API key mismatch", { secretId });
    throw new Error("Invalid API key");
  }

  loggerService.info("API key validated successfully", {
    organizationId,
    secretId,
  });

  return {
    organization,
    apiKeyMetadata,
  };
}

