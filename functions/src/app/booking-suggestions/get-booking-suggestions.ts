import {
  APPOINTMENT_STATUS,
  Appointment,
  AppointmentRepository,
  BookingSuggestion,
  CustomerRepository,
  GenkitService,
  LoggerService,
  Service,
  ServiceRepository,
} from "@/core";
import { isCompatibleAddOn } from "./service-add-ons";
import z from "zod";

const getBookingSuggestionsPayloadSchema = z.object({
  organizationId: z.string().min(1),
  serviceId: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

type GetBookingSuggestionsPayload = z.infer<
  typeof getBookingSuggestionsPayloadSchema
>;

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  customerRepository: CustomerRepository;
  genkitService?: GenkitService;
  loggerService: LoggerService;
  serviceRepository: ServiceRepository;
}

interface ScoredSuggestion {
  service: Service;
  reason: string;
  score: number;
  source: BookingSuggestion["source"];
}

function summarizeHistory(payload: {
  appointments: Appointment[];
  servicesById: Map<string, Service>;
}) {
  const counts = new Map<string, number>();

  for (const appointment of payload.appointments) {
    counts.set(appointment.serviceId, (counts.get(appointment.serviceId) || 0) + 1);

    for (const addOn of appointment.addOns || []) {
      counts.set(addOn.serviceId, (counts.get(addOn.serviceId) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([serviceId, count]) => ({
      serviceId,
      serviceName: payload.servicesById.get(serviceId)?.name || serviceId,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildRuleSuggestions(payload: {
  candidates: Service[];
  customerHistory: ReturnType<typeof summarizeHistory>;
  selectedService: Service;
}): ScoredSuggestion[] {
  const historyCounts = new Map(
    payload.customerHistory.map((historyItem) => [
      historyItem.serviceId,
      historyItem.count,
    ]),
  );

  return payload.candidates
    .map((candidate) => {
      const historyCount = historyCounts.get(candidate.id) || 0;
      const explicitlySuggested =
        payload.selectedService.suggestedWithServiceIds?.includes(candidate.id) ||
        false;
      const source: BookingSuggestion["source"] =
        historyCount > 0 ? "history" : "rule";

      return {
        service: candidate,
        reason:
          historyCount > 0
            ? "Popular with your previous bookings"
            : explicitlySuggested
              ? `Pairs well with ${payload.selectedService.name}`
              : `Recommended with ${payload.selectedService.name}`,
        score: (explicitlySuggested ? 30 : 0) + historyCount * 20,
        source,
      };
    })
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name));
}

function extractJsonArray(payload: { text: string }): unknown {
  const trimmed = payload.text.trim();
  const directParse = (() => {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  })();

  if (directParse) {
    return directParse;
  }

  const match = trimmed.match(/\[[\s\S]*\]/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function applyAiOrdering(payload: {
  aiResponse: string;
  ruleSuggestions: ScoredSuggestion[];
}): BookingSuggestion[] | null {
  const parsed = extractJsonArray({ text: payload.aiResponse });
  if (!Array.isArray(parsed)) {
    return null;
  }

  const ruleSuggestionsById = new Map(
    payload.ruleSuggestions.map((suggestion) => [
      suggestion.service.id,
      suggestion,
    ]),
  );

  const aiSuggestions = parsed
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const serviceId = "serviceId" in item ? String(item.serviceId) : "";
      const ruleSuggestion = ruleSuggestionsById.get(serviceId);
      if (!ruleSuggestion) {
        return null;
      }

      const reason =
        "reason" in item && typeof item.reason === "string"
          ? item.reason.slice(0, 160)
          : ruleSuggestion.reason;

      return toBookingSuggestion({
        scoredSuggestion: {
          ...ruleSuggestion,
          reason,
          source: "ai",
        },
      });
    })
    .filter((suggestion): suggestion is BookingSuggestion => !!suggestion);

  return aiSuggestions.length > 0 ? aiSuggestions : null;
}

function toBookingSuggestion(payload: {
  scoredSuggestion: ScoredSuggestion;
}): BookingSuggestion {
  const { service, reason, source } = payload.scoredSuggestion;

  return {
    serviceId: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    reason,
    source,
  };
}

async function getCustomerAppointments(payload: {
  customerEmail?: string;
  customerRepository: CustomerRepository;
  appointmentRepository: AppointmentRepository;
  organizationId: string;
}): Promise<Appointment[]> {
  if (!payload.customerEmail) {
    return [];
  }

  const customers = await payload.customerRepository.getAll({
    organizationId: payload.organizationId,
    queryConstraints: [
      { field: "email", operator: "==", value: payload.customerEmail },
    ],
  });
  const customer = customers[0];
  if (!customer) {
    return [];
  }

  const appointments = await payload.appointmentRepository.getAll({
    organizationId: payload.organizationId,
    queryConstraints: [{ field: "customerId", operator: "==", value: customer.id }],
  });

  return appointments.filter(
    (appointment) => appointment.status !== APPOINTMENT_STATUS.CANCELLED,
  );
}

async function getAiSuggestions(payload: {
  genkitService?: GenkitService;
  loggerService: LoggerService;
  ruleSuggestions: ScoredSuggestion[];
  selectedService: Service;
  customerHistory: ReturnType<typeof summarizeHistory>;
}): Promise<BookingSuggestion[] | null> {
  if (!payload.genkitService || payload.ruleSuggestions.length === 0) {
    return null;
  }

  try {
    const response = await payload.genkitService.executePrompt({
      prompt: [
        "Rank add-on service suggestions for a booking flow.",
        "Return only a JSON array of objects with serviceId and reason.",
        `Selected service: ${payload.selectedService.name}.`,
        `Candidates: ${JSON.stringify(
          payload.ruleSuggestions.map((suggestion) => ({
            serviceId: suggestion.service.id,
            name: suggestion.service.name,
            description: suggestion.service.description || "",
            price: suggestion.service.price,
            duration: suggestion.service.duration,
          })),
        )}`,
        `Customer history: ${JSON.stringify(payload.customerHistory)}`,
      ].join("\n"),
    });

    return applyAiOrdering({
      aiResponse: response,
      ruleSuggestions: payload.ruleSuggestions,
    });
  } catch (error) {
    payload.loggerService.warn("AI booking suggestions failed; using fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getBookingSuggestionsFn(
  payload: GetBookingSuggestionsPayload,
  dependencies: Dependencies,
): Promise<BookingSuggestion[]> {
  const validatedPayload = getBookingSuggestionsPayloadSchema.parse(payload);
  const {
    appointmentRepository,
    customerRepository,
    genkitService,
    loggerService,
    serviceRepository,
  } = dependencies;

  const services = await serviceRepository.getAll({
    organizationId: validatedPayload.organizationId,
  });
  const selectedService = services.find(
    (service) => service.id === validatedPayload.serviceId,
  );

  if (!selectedService) {
    throw new Error(`Service not found: ${validatedPayload.serviceId}`);
  }

  const candidates = services.filter((service) =>
    isCompatibleAddOn({
      addOnService: service,
      primaryServiceId: selectedService.id,
    }),
  );

  if (candidates.length === 0) {
    return [];
  }

  const appointments = await getCustomerAppointments({
    customerEmail: validatedPayload.customerEmail || undefined,
    customerRepository,
    appointmentRepository,
    organizationId: validatedPayload.organizationId,
  });
  const servicesById = new Map(services.map((service) => [service.id, service]));
  const customerHistory = summarizeHistory({
    appointments,
    servicesById,
  });
  const ruleSuggestions = buildRuleSuggestions({
    candidates,
    customerHistory,
    selectedService,
  });
  const aiSuggestions = await getAiSuggestions({
    genkitService,
    loggerService,
    ruleSuggestions,
    selectedService,
    customerHistory,
  });

  return (aiSuggestions || ruleSuggestions.map((scoredSuggestion) =>
    toBookingSuggestion({ scoredSuggestion }),
  )).slice(0, 3);
}
