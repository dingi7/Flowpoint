import { HttpsError } from "firebase-functions/https";

import {
  ClerkService,
  LoggerService,
  OrganizationRepository,
} from "@/core";

export const BILLING_REQUIRED_MESSAGE = "BILLING_REQUIRED";

interface Payload {
  organizationId: string;
  userId?: string;
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  clerkService: ClerkService;
  clerkSecretKey: string;
  loggerService: LoggerService;
}

export function isBillingRequiredError(error: unknown): error is HttpsError {
  return (
    error instanceof HttpsError &&
    error.code === "failed-precondition" &&
    error.message === BILLING_REQUIRED_MESSAGE
  );
}

export async function checkBilling(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { organizationId, userId } = payload;
  const {
    organizationRepository,
    clerkService,
    clerkSecretKey,
    loggerService,
  } = dependencies;

  const organization = await organizationRepository.get({ id: organizationId });
  if (!organization) {
    throw new HttpsError("not-found", "Organization not found");
  }

  let clerkOrganizationId = organization.clerkOrganizationId;

  if (!clerkOrganizationId && userId) {
    loggerService.info("Creating Clerk organization mapping", {
      organizationId,
      userId,
    });

    const clerkOrganization = await clerkService.createOrganization({
      apiKey: clerkSecretKey,
      name: organization.name,
      createdBy: userId,
    });

    if (!clerkOrganization) {
      throw new HttpsError("failed-precondition", BILLING_REQUIRED_MESSAGE);
    }

    clerkOrganizationId = clerkOrganization.id;

    await organizationRepository.update({
      id: organizationId,
      data: {
        clerkOrganizationId,
      },
    });
  }

  if (!clerkOrganizationId) {
    loggerService.info("Missing Clerk organization mapping", {
      organizationId,
    });
    throw new HttpsError("failed-precondition", BILLING_REQUIRED_MESSAGE);
  }

  const subscription = await clerkService.getOrganizationBillingSubscription({
    apiKey: clerkSecretKey,
    organizationId: clerkOrganizationId,
  });

  if (!subscription || subscription.status !== "active") {
    loggerService.info("Billing subscription missing or inactive", {
      organizationId,
      clerkOrganizationId,
      status: subscription?.status,
    });
    throw new HttpsError("failed-precondition", BILLING_REQUIRED_MESSAGE);
  }
}
