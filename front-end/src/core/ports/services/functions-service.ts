import { OrganizationSettingsData } from "@/core/entities/organization";

export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface FunctionsService {
  createOrganizationInvite(payload: {
    organizationId: string;
    inviteeEmail: string;
    inviteeRoleIds: string[];
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
