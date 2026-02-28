import { Request, Response } from "express";
import {
  ApiKeyHashRepository,
  ClerkService,
  LoggerService,
  OrganizationRepository,
  SecretManagerService,
} from "@/core";
import {
  BILLING_FEATURES,
  BILLING_REQUIRED_MESSAGE,
  checkBilling,
  isBillingRequiredError,
} from "./check-billing";
import { validateApiKey } from "./validate-api-key";

export interface AuthenticatedRequest extends Request {
  organizationId?: string;
  apiKeyMetadata?: {
    secretId: string;
    name: string;
  };
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  apiKeyHashRepository: ApiKeyHashRepository;
  clerkService: ClerkService;
  clerkSecretKey: string;
  loggerService: LoggerService;
}

export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  dependencies: Dependencies,
): Promise<boolean> {
  const {
    organizationRepository,
    secretManagerService,
    apiKeyHashRepository,
    clerkService,
    clerkSecretKey,
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

    try {
      await checkBilling(
        {
          organizationId: validationResult.organization.id,
          requiredFeatureSlugs: [BILLING_FEATURES.api],
        },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey,
          loggerService,
        },
      );
    } catch (error) {
      if (isBillingRequiredError(error)) {
        res.status(402).json({
          error: BILLING_REQUIRED_MESSAGE,
          success: false,
        });
        return false;
      }

      loggerService.error("Billing check failed", error);
      res.status(500).json({
        error: "Billing check failed",
        success: false,
      });
      return false;
    }

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
