import { Appointment, LoggerService, TimeOff } from "@/core";
import { Timeslot } from "@/core/dtos/timeslot";
import { Calendar } from "@/core/entities/calendar";
import { hasTimeslotOverlap } from "./util/appointment-overlap";
import { getDayOfWeek, timeStringToMinutes } from "./util/helpers";

interface Payload {
  date: Date;
  calendar: Calendar;
  serviceDuration: number;
  existingAppointments: Appointment[];
  timeOffs: TimeOff[];
}

interface Dependencies {
  loggerService: LoggerService;
}

/**
 * Generate available timeslots for a given date and calendar
 */
export function generateTimeslotsForDate(payload: Payload, dependencies: Dependencies): Timeslot[] {
  const { date, calendar, serviceDuration, existingAppointments, timeOffs } =
    payload;

  const { loggerService } = dependencies;

  loggerService.info("generateTimeslotsForDate", { date, calendar, serviceDuration, existingAppointments, timeOffs });

  const dayOfWeek = getDayOfWeek(date);
  const workingHours = calendar.workingHours[dayOfWeek];
  loggerService.info("dayOfWeek", dayOfWeek);
  loggerService.info("workingHours", workingHours);

  if (!workingHours || workingHours.length === 0) {
    loggerService.info("No working hours for this day", { date, calendar });
    return []; // No working hours for this day
  }


  const timeslots: Timeslot[] = [];
  const now = new Date();

  // Process each working hour block
  for (const workingBlock of workingHours) {
    const startMinutes = timeStringToMinutes(workingBlock.start);
    const endMinutes = timeStringToMinutes(workingBlock.end);

    loggerService.info("workingBlock", workingBlock);

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

      // Skip timeslots that are in the past
      if (slotStart < now) {
        continue;
      }

      const hasOverlap = hasTimeslotOverlap({
        slotStart,
        slotEnd,
        existingAppointments,
        timeOffs,
        bufferTime: calendar.bufferTime || 0,
      });

      // If no conflicts, add this timeslot
      if (!hasOverlap) {
        timeslots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  return timeslots;
}
