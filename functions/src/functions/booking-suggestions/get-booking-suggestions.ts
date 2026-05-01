import { getBookingSuggestionsFn } from "@/app/booking-suggestions/get-booking-suggestions";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkBilling, isBillingRequiredError } from "@/utils/check-billing";
import { defineSecret } from "firebase-functions/params";
import { onCall } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const googleGenAiApiKey = defineSecret(Secrets.GOOGLE_GENAI_API_KEY);

const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);

interface Payload {
  organizationId: string;
  serviceId: string;
  customerEmail?: string;
}

export const getBookingSuggestions = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey, googleGenAiApiKey],
    memory: "512MiB",
  },
  async (request) => {
    try {
      await checkBilling(
        { organizationId: request.data.organizationId },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );

      const apiKey = googleGenAiApiKey.value();
      const genkitService = apiKey
        ? serviceHost.getGenkitService({ apiKey })
        : undefined;

      const suggestions = await getBookingSuggestionsFn(request.data, {
        appointmentRepository,
        customerRepository,
        genkitService,
        loggerService,
        serviceRepository,
      });

      return {
        success: true,
        suggestions,
      };
    } catch (error) {
      if (isBillingRequiredError(error)) {
        throw error;
      }

      loggerService.error("Get booking suggestions error", error);
      throw new Error(
        `Failed to get booking suggestions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
);
