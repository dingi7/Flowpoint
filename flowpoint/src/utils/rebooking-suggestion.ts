import { APPOINTMENT_STATUS, Appointment, Service } from "@/core";

export interface RebookingSuggestion {
  suggestedDate: Date;
  intervalDays: number;
  reason: string;
  source: "history" | "service" | "default";
}

const DEFAULT_REBOOKING_INTERVAL_DAYS = 30;

function addDays(payload: { date: Date; days: number }): Date {
  const result = new Date(payload.date);
  result.setDate(result.getDate() + payload.days);
  return result;
}

function getMedianIntervalDays(payload: { appointments: Appointment[] }) {
  const intervals = payload.appointments
    .slice(1)
    .map((appointment, index) => {
      const previous = payload.appointments[index];
      const diffMs =
        new Date(appointment.startTime).getTime() -
        new Date(previous.startTime).getTime();
      return Math.round(diffMs / (24 * 60 * 60 * 1000));
    })
    .filter((days) => days >= 7 && days <= 180)
    .sort((a, b) => a - b);

  return intervals.length ? intervals[Math.floor(intervals.length / 2)] : null;
}

export function getRebookingSuggestion(payload: {
  appointment: Appointment;
  customerAppointments: Appointment[];
  service?: Service | null;
}): RebookingSuggestion | null {
  if (
    payload.appointment.status !== APPOINTMENT_STATUS.COMPLETED ||
    !payload.appointment.startTime
  ) {
    return null;
  }

  const sameServiceAppointments = payload.customerAppointments
    .filter(
      (appointment) =>
        appointment.serviceId === payload.appointment.serviceId &&
        appointment.status === APPOINTMENT_STATUS.COMPLETED &&
        !!appointment.startTime,
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  const historyInterval = getMedianIntervalDays({
    appointments: sameServiceAppointments,
  });
  const serviceInterval = payload.service?.rebookingIntervalDays;
  const intervalDays =
    historyInterval || serviceInterval || DEFAULT_REBOOKING_INTERVAL_DAYS;
  const source: RebookingSuggestion["source"] = historyInterval
    ? "history"
    : serviceInterval
      ? "service"
      : "default";

  return {
    intervalDays,
    suggestedDate: addDays({
      date: new Date(payload.appointment.startTime),
      days: intervalDays,
    }),
    reason: historyInterval
      ? `Based on the customer's ${intervalDays}-day booking cadence.`
      : serviceInterval
        ? `Based on this service's configured ${intervalDays}-day cadence.`
        : `Using the default ${intervalDays}-day cadence.`,
    source,
  };
}
