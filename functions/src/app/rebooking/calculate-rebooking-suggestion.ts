import { APPOINTMENT_STATUS, Appointment, GenkitService, Service } from "@/core";

export interface RebookingSuggestion {
  suggestedDate: string;
  intervalDays: number;
  reason: string;
  source: "ai" | "history" | "service" | "default";
}

interface CalculateRebookingSuggestionPayload {
  appointment: Appointment;
  customerAppointments: Appointment[];
  service: Service;
  genkitService?: GenkitService;
}

const DEFAULT_REBOOKING_INTERVAL_DAYS = 30;
const MIN_HISTORY_INTERVAL_DAYS = 7;
const MAX_HISTORY_INTERVAL_DAYS = 180;

function addDays(payload: { date: Date; days: number }): Date {
  const result = new Date(payload.date);
  result.setUTCDate(result.getUTCDate() + payload.days);
  return result;
}

function getCompletedServiceAppointments(payload: {
  appointments: Appointment[];
  serviceId: string;
}) {
  return payload.appointments
    .filter(
      (appointment) =>
        appointment.serviceId === payload.serviceId &&
        appointment.status === APPOINTMENT_STATUS.COMPLETED &&
        !!appointment.startTime,
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
}

function getMedianIntervalDays(payload: {
  appointments: Appointment[];
}): number | null {
  const intervals = payload.appointments
    .slice(1)
    .map((appointment, index) => {
      const previous = payload.appointments[index];
      const diffMs =
        new Date(appointment.startTime).getTime() -
        new Date(previous.startTime).getTime();
      return Math.round(diffMs / (24 * 60 * 60 * 1000));
    })
    .filter(
      (days) =>
        days >= MIN_HISTORY_INTERVAL_DAYS &&
        days <= MAX_HISTORY_INTERVAL_DAYS,
    )
    .sort((a, b) => a - b);

  if (intervals.length === 0) {
    return null;
  }

  return intervals[Math.floor(intervals.length / 2)];
}

function buildFallbackSuggestion(payload: {
  appointment: Appointment;
  customerAppointments: Appointment[];
  service: Service;
}): RebookingSuggestion {
  const serviceHistory = getCompletedServiceAppointments({
    appointments: payload.customerAppointments,
    serviceId: payload.service.id,
  });
  const historyInterval = getMedianIntervalDays({
    appointments: serviceHistory,
  });
  const serviceInterval = payload.service.rebookingIntervalDays;
  const intervalDays =
    historyInterval ||
    serviceInterval ||
    DEFAULT_REBOOKING_INTERVAL_DAYS;
  const source: RebookingSuggestion["source"] = historyInterval
    ? "history"
    : serviceInterval
      ? "service"
      : "default";
  const appointmentDate = new Date(payload.appointment.startTime);

  return {
    intervalDays,
    suggestedDate: addDays({
      date: appointmentDate,
      days: intervalDays,
    }).toISOString(),
    reason: historyInterval
      ? `Based on this customer's ${intervalDays}-day booking cadence for ${payload.service.name}.`
      : serviceInterval
        ? `Based on the configured ${intervalDays}-day rebooking interval for ${payload.service.name}.`
        : `Using the default ${intervalDays}-day rebooking interval.`,
    source,
  };
}

function extractJsonObject(payload: { text: string }): unknown {
  const trimmed = payload.text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function getAiSuggestion(payload: {
  fallback: RebookingSuggestion;
  appointment: Appointment;
  customerAppointments: Appointment[];
  service: Service;
  genkitService?: GenkitService;
}): Promise<RebookingSuggestion | null> {
  if (!payload.genkitService) {
    return null;
  }

  const history = getCompletedServiceAppointments({
    appointments: payload.customerAppointments,
    serviceId: payload.service.id,
  }).map((appointment) => ({
    startTime: appointment.startTime,
    duration: appointment.duration,
    fee: appointment.finalFee ?? appointment.fee,
  }));

  const response = await payload.genkitService.executePrompt({
    prompt: [
      "Suggest a rebooking interval for a completed appointment.",
      "Return only JSON with intervalDays (integer 7-180) and reason (short sentence).",
      `Service: ${payload.service.name}.`,
      `Configured service interval: ${payload.service.rebookingIntervalDays || "not set"}.`,
      `Fallback interval: ${payload.fallback.intervalDays}.`,
      `Appointment start: ${payload.appointment.startTime}.`,
      `Customer completed history for this service: ${JSON.stringify(history)}`,
    ].join("\n"),
  });
  const parsed = extractJsonObject({ text: response });

  if (!parsed || typeof parsed !== "object" || !("intervalDays" in parsed)) {
    return null;
  }

  const intervalDays = Math.round(Number(parsed.intervalDays));
  if (
    Number.isNaN(intervalDays) ||
    intervalDays < MIN_HISTORY_INTERVAL_DAYS ||
    intervalDays > MAX_HISTORY_INTERVAL_DAYS
  ) {
    return null;
  }

  const reason =
    "reason" in parsed && typeof parsed.reason === "string"
      ? parsed.reason.slice(0, 180)
      : payload.fallback.reason;
  const appointmentDate = new Date(payload.appointment.startTime);

  return {
    intervalDays,
    suggestedDate: addDays({
      date: appointmentDate,
      days: intervalDays,
    }).toISOString(),
    reason,
    source: "ai",
  };
}

export async function calculateRebookingSuggestion(
  payload: CalculateRebookingSuggestionPayload,
): Promise<RebookingSuggestion> {
  const fallback = buildFallbackSuggestion(payload);

  try {
    return (
      (await getAiSuggestion({
        ...payload,
        fallback,
      })) || fallback
    );
  } catch {
    return fallback;
  }
}
