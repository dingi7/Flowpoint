import { Appointment, TimeOff } from "@/core";
import { Timeslot } from "@/core/dtos/timeslot";
import { Calendar } from "@/core/entities/calendar";
import {
  getDayOfWeek,
  timeRangesOverlap,
  timeStringToMinutes,
} from "./util/helpers";

interface Payload {
  date: Date;
  calendar: Calendar;
  serviceDuration: number;
  existingAppointments: Appointment[];
  timeOffs: TimeOff[];
}

/**
 * Generate available timeslots for a given date and calendar
 */
export function generateTimeslotsForDate(payload: Payload): Timeslot[] {
  const { date, calendar, serviceDuration, existingAppointments, timeOffs } =
    payload;

  const dayOfWeek = getDayOfWeek(date);
  const workingHours = calendar.workingHours[dayOfWeek];

  if (!workingHours || workingHours.length === 0) {
    return []; // No working hours for this day
  }

  const timeslots: Timeslot[] = [];
  const bufferTime = calendar.bufferTime || 0;

  // Process each working hour block
  for (const workingBlock of workingHours) {
    const startMinutes = timeStringToMinutes(workingBlock.start);
    const endMinutes = timeStringToMinutes(workingBlock.end);

    // Generate all possible timeslots within this working block
    for (
      let currentMinutes = startMinutes;
      currentMinutes + serviceDuration <= endMinutes;
      currentMinutes += 15
    ) {
      const slotStart = new Date(date);
      slotStart.setHours(
        Math.floor(currentMinutes / 60),
        currentMinutes % 60,
        0,
        0,
      );

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      // Check if this timeslot conflicts with existing appointments
      const hasAppointmentConflict = existingAppointments.some(
        (appointment) => {
          const appointmentStart = new Date(appointment.startTime);
          const appointmentEnd = new Date(appointmentStart);
          appointmentEnd.setMinutes(
            appointmentEnd.getMinutes() + appointment.duration + bufferTime,
          );

          return timeRangesOverlap(
            slotStart,
            slotEnd,
            appointmentStart,
            appointmentEnd,
          );
        },
      );

      // Check if this timeslot conflicts with time-offs
      const hasTimeOffConflict = timeOffs.some((timeOff) => {
        const timeOffStart = new Date(timeOff.startAt);
        const timeOffEnd = new Date(timeOff.endAt);

        return timeRangesOverlap(slotStart, slotEnd, timeOffStart, timeOffEnd);
      });

      // If no conflicts, add this timeslot
      if (!hasAppointmentConflict && !hasTimeOffConflict) {
        timeslots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  return timeslots;
}
