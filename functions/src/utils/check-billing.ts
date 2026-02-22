import { HttpsError } from "firebase-functions/https";

import {
  ClerkService,
  LoggerService,
  OrganizationRepository,
} from "@/core";

export const BILLING_REQUIRED_MESSAGE = "BILLING_REQUIRED";
export const MEMBER_LIMIT_REACHED_MESSAGE = "MEMBER_LIMIT_REACHED";
export const FREE_ORG_PLAN_SLUG = "free_org";

export const BILLING_FEATURES = {
  crm: "crm",
  api: "api",
  webhooks: "webhooks",
} as const;

interface Payload {
  organizationId: string;
  userId?: string;
  requiredFeatureSlugs?: string[];
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  clerkService: ClerkService;
  clerkSecretKey: string;
  loggerService: LoggerService;
}

export interface OrganizationBillingContext {
  organizationId: string;
  clerkOrganizationId: string;
  subscriptionStatus: string;
  planSlugs: string[];
  featureSlugs: string[];
}

export function isBillingRequiredError(error: unknown): error is HttpsError {
  return (
    error instanceof HttpsError &&
    error.code === "failed-precondition" &&
    error.message === BILLING_REQUIRED_MESSAGE
  );
}

async function getClerkOrganizationId(
  payload: Pick<Payload, "organizationId" | "userId">,
  dependencies: Dependencies,
): Promise<string> {
  const { organizationId, userId } = payload;
  const {
    organizationRepository,
    loggerService,
    clerkService,
    clerkSecretKey,
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

  return clerkOrganizationId;
}

function getBillingContextFromSubscription(
  payload: {
    organizationId: string;
    clerkOrganizationId: string;
    subscriptionStatus: string;
    subscriptionItems: Array<{
      status: string;
      plan:
        | {
            slug: string;
            features: Array<{ slug: string }>;
          }
        | null;
    }>;
  },
): OrganizationBillingContext {
  const activeItems = payload.subscriptionItems.filter(
    (subscriptionItem) =>
      subscriptionItem.status === "active" ||
      subscriptionItem.status === "past_due",
  );

  const planSlugs = Array.from(
    new Set(
      activeItems
        .map((subscriptionItem) => subscriptionItem.plan?.slug)
        .filter((planSlug): planSlug is string => Boolean(planSlug)),
    ),
  );

  const featureSlugs = Array.from(
    new Set(
      activeItems.flatMap((subscriptionItem) =>
        (subscriptionItem.plan?.features ?? [])
          .map((feature) => feature.slug)
          .filter((featureSlug): featureSlug is string => Boolean(featureSlug)),
      ),
    ),
  );

  return {
    organizationId: payload.organizationId,
    clerkOrganizationId: payload.clerkOrganizationId,
    subscriptionStatus: payload.subscriptionStatus,
    planSlugs,
    featureSlugs,
  };
}

export async function getOrganizationBillingContext(
  payload: Pick<Payload, "organizationId" | "userId">,
  dependencies: Dependencies,
): Promise<OrganizationBillingContext> {
  const { organizationId } = payload;
  const { clerkService, clerkSecretKey, loggerService } = dependencies;

  const clerkOrganizationId = await getClerkOrganizationId(payload, dependencies);

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

  return getBillingContextFromSubscription({
    organizationId,
    clerkOrganizationId,
    subscriptionStatus: subscription.status,
    subscriptionItems: subscription.subscriptionItems,
  });
}

export async function checkBilling(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const requiredFeatureSlugs =
    payload.requiredFeatureSlugs !== undefined
      ? payload.requiredFeatureSlugs
      : [BILLING_FEATURES.crm];

  const billingContext = await getOrganizationBillingContext(payload, dependencies);

  const missingFeatureSlugs = requiredFeatureSlugs.filter(
    (requiredFeatureSlug) =>
      !billingContext.featureSlugs.includes(requiredFeatureSlug),
  );

  if (missingFeatureSlugs.length > 0) {
    dependencies.loggerService.info("Missing required billing features", {
      organizationId: payload.organizationId,
      missingFeatureSlugs,
      planSlugs: billingContext.planSlugs,
      featureSlugs: billingContext.featureSlugs,
    });
    throw new HttpsError("failed-precondition", BILLING_REQUIRED_MESSAGE);
  }
}
