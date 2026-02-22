import "../infrastructure/local-init";
import { serviceHost } from "@/services";

import { repositoryHost } from "@/repositories";
import { createClerkClient } from "@clerk/backend";
import { OrganizationData } from "@/core";

const clerkSecretKey = "sk_live_dSzc79UkhlcBkOcIQlfr8HKpZny5ngztzr5ApgmO03"

const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
const databaseService = serviceHost.getDatabaseService();
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);

const getClerkErrorCode = (error: unknown): string | undefined => {
  const err = error as { errors?: Array<{ code?: string }> };
  return err?.errors?.[0]?.code;
};

const isMembershipAlreadyExists = (error: unknown) => {
  const code = getClerkErrorCode(error);
  return (
    code === "organization_membership_exists" ||
    code === "resource_exists" ||
    code === "already_member" ||
    code === "organization_membership_already_exists"
  );
};

const createOrganizationInClerk = async (
  orgId: string,
  data: OrganizationData,
  createdBy?: string,
) => {
  const basePayload = {
    name: data.name ?? `Organization ${orgId}`,
    slug: data.slug,
    publicMetadata: {
      internalOrganizationId: orgId,
    },
  };

  try {
    return await clerkClient.organizations.createOrganization({
      ...basePayload,
      createdBy,
    });
  } catch (error) {
    if (!createdBy) {
      throw error;
    }
    console.warn(
      `Failed to create Clerk org with createdBy=${createdBy} for ${orgId}. Retrying without createdBy.`,
    );
    return await clerkClient.organizations.createOrganization(basePayload);
  }
};

const addMembership = async (
  organizationId: string,
  userId: string,
  role: "org:member" | "org:admin",
) => {
  try {
    await clerkClient.organizations.createOrganizationMembership({
      organizationId,
      userId,
      role,
    });
    return { added: true };
  } catch (error) {
    if (isMembershipAlreadyExists(error)) {
      return { added: false, skipped: true };
    }
    throw error;
  }
};

const run = async () => {
  const dryRun = false;
  const orgs = await organizationRepository.getAll({});

  let processed = 0;
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let membershipAdded = 0;
  let membershipSkipped = 0;
  let errors = 0;

  for (const org of orgs) {

    processed += 1;
    const orgId = org.id;
    const hasClerkOrgId = Boolean(org.clerkOrganizationId);

    if (hasClerkOrgId) {
      skipped += 1;
      continue;
    }

    const members = await memberRepository.getAll({
      organizationId: orgId,
    });
    const memberIds = members.map((member) => member.id);
    const createdBy = memberIds[0];

    let clerkOrganizationId = org.clerkOrganizationId;

    if (!clerkOrganizationId) {
      console.log(
        `Creating Clerk org for ${orgId} (${org.name ?? "Unnamed"})`,
      );
      if (dryRun) {
        created += 1;
      } else {
        try {
          const clerkOrg = await createOrganizationInClerk(
            orgId,
            org,
            createdBy,
          );
          clerkOrganizationId = clerkOrg.id;
          await organizationRepository.update({
            id: orgId,
            data: {
              clerkOrganizationId,
            },
          });
          created += 1;
          updated += 1;
        } catch (error) {
          errors += 1;
          console.error(`Failed to create Clerk org for ${orgId}`, error);
          continue;
        }
      }
    }

    if (!clerkOrganizationId) {
      continue;
    }

    if (memberIds.length === 0) {
      continue;
    }

    if (dryRun) {
      membershipAdded += memberIds.length;
      continue;
    }

    for (const userId of memberIds) {
      const role = userId === createdBy ? "org:admin" : "org:member";
      try {
        const result = await addMembership(clerkOrganizationId, userId, role);
        if (result.added) {
          membershipAdded += 1;
        } else if (result.skipped) {
          membershipSkipped += 1;
        }
      } catch (error) {
        errors += 1;
        console.error(
          `Failed to add membership (org=${orgId}, user=${userId})`,
          error,
        );
      }
    }
  }

  console.log("Done.", {
    processed,
    created,
    skipped,
    updated,
    membershipAdded,
    membershipSkipped,
    errors,
    dryRun,
  });
};

run().catch((error) => {
  console.error("Script failed.", error);
  process.exitCode = 1;
});
