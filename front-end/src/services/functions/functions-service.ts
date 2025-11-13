import { ApiKey, FunctionsService, OrganizationSettingsData, BookAppointmentPayload, BookAppointmentResponse } from "@/core";
import { firebase } from "@/infrastructure/firebase";
import { httpsCallable } from "@firebase/functions";

export const functionsService: FunctionsService = {
  async getAvailableTimeslots(payload) {
    const result = await httpsCallable<
      {
        serviceId: string;
        date: string;
        organizationId: string;
      },
      {
        start: string;
        end: string;
      }[]
    >(
      firebase.functions,
      "getAvailableTimeslots",
    )(payload);
    return { result: result.data };
  },
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
  async bookAppointment(payload) {
    const result = await httpsCallable<
      BookAppointmentPayload,
      BookAppointmentResponse
    >(
      firebase.functions,
      "bookAppointment",
    )(payload);
    return result.data;
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
  async kickOrganizationMember(payload) {
    const result = await httpsCallable<
      {
        memberId: string;
        organizationId: string;
      },
      { success: boolean }
    >(
      firebase.functions,
      "kickOrganizationMember",
    )(payload);
    return result.data;
  },
  async createApiKey(payload) {
    const result = await httpsCallable<
      {
        organizationId: string;
        name: string;
      },
      {
        apiKey: string;
        apiKeyMetadata: ApiKey;
      }
    >(
      firebase.functions,
      "createApiKey",
    )(payload);
    return result.data;
  },
};
