import { ApiKey, OrganizationSettingsData } from "@/core/entities/organization";
import { WebhookSubscription } from "@/core/entities/webhook-subscription";
  
export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface BookAppointmentPayload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  fee?: number;
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export interface BookAppointmentResponse {
  success: boolean;
  appointmentId: string;
  confirmationDetails: any;
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
  bookAppointment(payload: BookAppointmentPayload): Promise<BookAppointmentResponse>;
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
  kickOrganizationMember(payload: {
    memberId: string;
    organizationId: string;
  }): Promise<{ success: boolean }>;
  createApiKey(payload: {
    organizationId: string;
    name: string;
  }): Promise<{
    apiKey: string;
    apiKeyMetadata: ApiKey;
  }>;
  revokeApiKey(payload: {
    organizationId: string;
    secretId: string;
  }): Promise<void>;
  createWebhookSubscription(payload: {
    organizationId: string;
    eventTypes: string[];
    callbackUrl: string;
  }): Promise<{
    webhookSubscription: WebhookSubscription;
  }>;
  removeWebhookSubscription(payload: {
    organizationId: string;
    subscriptionId: string;
  }): Promise<void>;
}
