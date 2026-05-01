import { APPOINTMENT_STATUS, Appointment } from "@/core";

interface GetPriorNoShowCountPayload {
  appointment: Appointment;
  noShowAppointments: Appointment[];
}

export function getPriorNoShowCount({
  appointment,
  noShowAppointments,
}: GetPriorNoShowCountPayload): number {
  const appointmentStart = appointment.startTime
    ? new Date(appointment.startTime).getTime()
    : Date.now();

  return noShowAppointments.filter((noShowAppointment) => {
    if (
      noShowAppointment.customerId !== appointment.customerId ||
      noShowAppointment.status !== APPOINTMENT_STATUS.NO_SHOW
    ) {
      return false;
    }

    if (noShowAppointment.id === appointment.id) {
      return false;
    }

    const noShowStart = noShowAppointment.startTime
      ? new Date(noShowAppointment.startTime).getTime()
      : 0;

    return noShowStart < appointmentStart;
  }).length;
}

export function isUnreliableClient(payload: GetPriorNoShowCountPayload): boolean {
  return getPriorNoShowCount(payload) > 0;
}
