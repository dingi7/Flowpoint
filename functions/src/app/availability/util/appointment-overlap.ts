import { Appointment, TimeOff } from "@/core";
import { timeRangesOverlap } from "./helpers";

interface Payload {
  slotStart: Date;
  slotEnd: Date;
  existingAppointments: Appointment[];
  timeOffs: TimeOff[];
  bufferTime?: number;
}

/**
 * Check if a timeslot overlaps with existing appointments or time-offs
 * @param payload - The parameters for checking overlap
 * @returns true if there is an overlap, false otherwise
 */
export function hasTimeslotOverlap(payload: Payload): boolean {
  const { slotStart, slotEnd, existingAppointments, timeOffs, bufferTime = 0 } = payload;

  // Check if this timeslot conflicts with existing appointments
  const hasAppointmentConflict = existingAppointments.some((appointment) => {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(
      appointmentEnd.getMinutes() + appointment.duration + bufferTime,
    );

    return timeRangesOverlap(slotStart, slotEnd, appointmentStart, appointmentEnd);
  });

  // Check if this timeslot conflicts with time-offs
  const hasTimeOffConflict = timeOffs.some((timeOff) => {
    const timeOffStart = new Date(timeOff.startAt);
    const timeOffEnd = new Date(timeOff.endAt);

    return timeRangesOverlap(slotStart, slotEnd, timeOffStart, timeOffEnd);
  });

  return hasAppointmentConflict || hasTimeOffConflict;
}