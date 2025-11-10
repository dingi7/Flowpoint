import { Request, Response } from "express";
import {
  ApiKeyHashRepository,
  LoggerService,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";
import { validateApiKey } from "./validate-api-key";

export interface AuthenticatedRequest extends Request {
  organizationId?: string;
  apiKeyMetadata?: {
    secretId: string;
    name: string;
  };
}

export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  dependencies: {
    organizationRepository: OrganizationRepository;
    secretManagerService: SecretManagerService;
    apiKeyHashRepository: ApiKeyHashRepository;
    loggerService: LoggerService;
  },
): Promise<boolean> {
  const {
    organizationRepository,
    secretManagerService,
    apiKeyHashRepository,
    loggerService,
  } = dependencies;

  // Extract API key from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "Missing Authorization header",
      success: false,
    });
    return false;
  }

  // Support both "Bearer <key>" and direct key format
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (!apiKey || apiKey.trim().length === 0) {
    res.status(401).json({
      error: "Invalid API key format",
      success: false,
    });
    return false;
  }

  try {
    const validationResult = await validateApiKey(
      { apiKey },
      {
        organizationRepository,
        secretManagerService,
        apiKeyHashRepository,
        loggerService,
      },
    );

    // Attach organization ID and API key metadata to request
    req.organizationId = validationResult.organization.id;
    req.apiKeyMetadata = {
      secretId: validationResult.apiKeyMetadata.secretId,
      name: validationResult.apiKeyMetadata.name,
    };

    return true;
  } catch (error) {
    loggerService.error("API key authentication failed", error);
    res.status(401).json({
      error: "Invalid API key",
      success: false,
    });
    return false;
  }
}

