import {
  ApiKey,
  BookAppointmentPayload,
  BookAppointmentResponse,
  FunctionsService,
  OrganizationSettingsData,
  WebhookSubscription,
} from "@/core";
import { firebase } from "@/infrastructure/firebase";
import { httpsCallable } from "@firebase/functions";

type FirebaseFunctionError = {
  code?: string;
  message?: string;
};

const BILLING_REQUIRED_MESSAGE = "BILLING_REQUIRED";

function isBillingRequiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, message } = error as FirebaseFunctionError;
  const normalizedCode = typeof code === "string" ? code : "";
  const normalizedMessage = typeof message === "string" ? message : "";

  return (
    normalizedMessage.includes(BILLING_REQUIRED_MESSAGE) &&
    (normalizedCode === "functions/failed-precondition" ||
      normalizedCode === "failed-precondition")
  );
}

function redirectToBilling(): void {
  if (window.location.pathname.startsWith("/billing")) {
    return;
  }

  const from = `${window.location.pathname}${window.location.search}`;
  const searchParams = new URLSearchParams({ from });
  window.location.assign(`/billing?${searchParams.toString()}`);
}

async function callFunction<TRequest, TResponse>(
  name: string,
  payload: TRequest,
): Promise<TResponse> {
  try {
    const result = await httpsCallable<TRequest, TResponse>(
      firebase.functions,
      name,
    )(payload);
    return result.data;
  } catch (error) {
    if (isBillingRequiredError(error)) {
      redirectToBilling();
    }
    throw error;
  }
}

export const functionsService: FunctionsService = {
  async getAvailableTimeslots(payload) {
    const data = await callFunction<
      {
        serviceId: string;
        date: string;
        organizationId: string;
        assigneeId: string;
      },
      {
        start: string;
        end: string;
      }[]
    >(
      "getAvailableTimeslots",
      payload,
    );
    return { result: data };
  },
  async createOrganizationInvite(payload) {
    const data = await callFunction<
      {
        organizationId: string;
        inviteeEmail: string;
        inviteeRoleIds: string[];
      },
      string
    >(
      "createOrganizationInvite",
      payload,
    );
    return data;
  },
  async acceptOrganizationInvite(payload) {
    await callFunction<
      {
        inviteId: string;
        name: string;
        image?: string;
        description?: string;
      },
      void
    >(
      "acceptOrganizationInvite",
      payload,
    );
  },
  async bookAppointment(payload) {
    const data = await callFunction<
      BookAppointmentPayload,
      BookAppointmentResponse
    >(
      "bookAppointment",
      payload,
    );
    return data;
  },
  async createOrganization(payload) {
    const data = await callFunction<
      {
        name: string;
        image?: string;
        industry?: string;
        currency: string;
        settings: OrganizationSettingsData;
      },
      string
    >(
      "createOrganization",
      payload,
    );
    return data;
  },
  async kickOrganizationMember(payload) {
    const data = await callFunction<
      {
        memberId: string;
        organizationId: string;
      },
      { success: boolean }
    >(
      "kickOrganizationMember",
      payload,
    );
    return data;
  },
  async createApiKey(payload) {
    const data = await callFunction<
      {
        organizationId: string;
        name: string;
      },
      {
        apiKey: string;
        apiKeyMetadata: ApiKey;
      }
    >(
      "createApiKey",
      payload,
    );
    return data;
  },
  async revokeApiKey(payload) {
    await callFunction<
      {
        organizationId: string;
        secretId: string;
      },
      void
    >(
      "revokeApiKey",
      payload,
    );
  },
  async createWebhookSubscription(payload) {
    const data = await callFunction<
      {
        organizationId: string;
        eventTypes: string[];
        callbackUrl: string;
      },
      {
        webhookSubscription: WebhookSubscription;
      }
    >(
      "createWebhookSubscription",
      payload,
    );
    return data;
  },
  async removeWebhookSubscription(payload) {
    await callFunction<
      {
        organizationId: string;
        subscriptionId: string;
      },
      void
    >(
      "removeWebhookSubscription",
      payload,
    );
  },
};
