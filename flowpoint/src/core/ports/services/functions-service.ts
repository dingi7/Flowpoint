import { ApiKey, OrganizationSettingsData } from "@/core/entities/organization";
import { AnalyticsDashboardResponse } from "@/core/entities/analytics";
import { WebhookSubscription } from "@/core/entities/webhook-subscription";

export interface DeleteResponse {
  deleted: boolean;
  error?: string;
}

export interface BookAppointmentPayload {
  serviceId: string;
  customerEmail: string;
  customerData: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
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

export interface CalendarSyncStatusResponse {
  connected: boolean;
  syncEnabled: boolean;
  status: "connected" | "disconnected" | "reauth_required" | "error";
  googleAccountEmail?: string;
  appleIcsUrl?: string;
  backfillStatus: "idle" | "pending" | "running" | "completed" | "failed";
  lastError?: string;
}

export interface AnalyticsDashboardPayload {
  organizationId: string;
  startDate?: string;
  endDate?: string;
}

export interface FunctionsService {
  getAvailableTimeslots(payload: {
    serviceId: string;
    date: string;
    organizationId: string;
    assigneeId: string;
  }): Promise<{
    result: {
      start: string;
      end: string;
      basePrice?: number;
      finalPrice?: number;
      discountAmount?: number;
      pricingRuleId?: string;
      pricingLabel?: string;
    }[];
  }>;
  bookAppointment(
    payload: BookAppointmentPayload,
  ): Promise<BookAppointmentResponse>;
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
  createApiKey(payload: { organizationId: string; name: string }): Promise<{
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
  startGoogleCalendarConnect(payload: {
    organizationId: string;
    returnUrl: string;
  }): Promise<{ authUrl: string }>;
  getMyCalendarSyncStatus(payload: {
    organizationId: string;
  }): Promise<CalendarSyncStatusResponse>;
  setMyCalendarAutoSync(payload: {
    organizationId: string;
    enabled: boolean;
  }): Promise<void>;
  disconnectMyCalendarSync(payload: {
    organizationId: string;
  }): Promise<void>;
  getAnalyticsDashboard(
    payload: AnalyticsDashboardPayload,
  ): Promise<AnalyticsDashboardResponse>;
  rebuildAnalytics(
    payload: AnalyticsDashboardPayload,
  ): Promise<AnalyticsDashboardResponse>;
}
