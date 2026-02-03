import { cache } from "react";
import { adminFirestore } from "./firebase-admin";
import { LandingPageSettings, Member, Organization, Service } from "@/core";

export type LandingPageData = {
  organization: Organization;
  landingPage: LandingPageSettings;
  services: Service[];
  members: Member[];
};

type FirestoreValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | FirestoreValue[]
  | { [key: string]: FirestoreValue };

function normalizeFirestoreData(value: any): FirestoreValue {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizeFirestoreData(item));
    }

    const normalized: Record<string, FirestoreValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      normalized[key] = normalizeFirestoreData(nested);
    }
    return normalized;
  }

  return value;
}

export const getLandingPageData = cache(
  async (slug: string): Promise<LandingPageData | null> => {
    if (!slug) {
      return null;
    }
    const normalizedSlug = slug.toLowerCase();

    const orgSnapshot = await adminFirestore
      .collection("organizations")
      .where("slug", "==", normalizedSlug)
      .limit(1)
      .get();

    if (orgSnapshot.empty) {
      return null;
    }

    const orgDoc = orgSnapshot.docs[0];
    const organization = normalizeFirestoreData({
      id: orgDoc.id,
      ...orgDoc.data(),
    }) as Organization;

    if (!organization.landingPage?.enabled) {
      return null;
    }

    const landingPage = organization.landingPage as LandingPageSettings;

    const servicesSnapshot = await adminFirestore
      .collection(`organizations/${organization.id}/services`)
      .get();

    const membersSnapshot = await adminFirestore
      .collection(`organizations/${organization.id}/members`)
      .get();

    const services = servicesSnapshot.docs.map(
      (doc) =>
        normalizeFirestoreData({ id: doc.id, ...doc.data() }) as Service,
    );

    const members = membersSnapshot.docs.map(
      (doc) =>
        normalizeFirestoreData({ id: doc.id, ...doc.data() }) as Member,
    );

    return {
      organization,
      landingPage,
      services,
      members,
    };
  },
);
