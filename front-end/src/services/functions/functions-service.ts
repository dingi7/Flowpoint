import { FunctionsService, OrganizationSettingsData } from "@/core";
import { firebase } from "@/infrastructure/firebase";
import { httpsCallable } from "@firebase/functions";

export const functionsService: FunctionsService = {
  async createOrganizationInvite(payload) {
    const result = await httpsCallable<
      {
        organizationId: string;
        inviteeEmail: string;
        inviteeRoleIds: string[];
      },
      string
    >(
      firebase.functions,
      "createOrganizationInvite",
    )(payload);
    return result.data;
  },
  async acceptOrganizationInvite(payload) {
    await httpsCallable<
      {
        inviteId: string;
        name: string;
        image?: string;
        description?: string;
      },
      void
    >(
      firebase.functions,
      "acceptOrganizationInvite",
    )(payload);
  },
  async createOrganization(payload) {
    const result = await httpsCallable<
      {
        name: string;
        image?: string;
        industry?: string;
        currency: string;
        settings: OrganizationSettingsData;
      },
      string
    >(
      firebase.functions,
      "createOrganization",
    )(payload);
    return result.data;
  },
};
