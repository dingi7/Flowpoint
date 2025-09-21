import { OrganizationSettingsData } from "@/core/entities/organization";

export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface FunctionsService {
  getAvailableTimeslots(payload: {
    serviceId: string;
    date: string;
    organizationId: string;
  }): Promise<{
    result: {
      start: string;
      end: string;
    }[];
  }>;
  createOrganizationInvite(payload: {
    organizationId: string;
    inviteeEmail: string;
    inviteeRoleIds: string[];
    validFor?: number;
  }): Promise<string>;
  acceptOrganizationInvite(payload: {
    inviteId: string;
    name: string;
    image?: string;
    description?: string;
  }): Promise<void>;
  createOrganization(payload: {
    name: string;
    image?: string;
    industry?: string;
    currency: string;
    settings: OrganizationSettingsData;
  }): Promise<string>;
}
