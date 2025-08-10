import z from "zod";
import { baseEntitySchema } from "./base";

// Day of week enum
export const DayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

// HH:MM format validator
export const TimeStringSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "Invalid time format, expected HH:MM (24h)",
  );
export type TimeString = z.infer<typeof TimeStringSchema>;

// Working hours schema
export const WorkingHoursSchema = z.record(
  DayOfWeekEnum,
  z.array(
    z.object({
      start: TimeStringSchema, // start of availability
      end: TimeStringSchema, // end of availability
    }),
  ),
);

export type WorkingHours = z.infer<typeof WorkingHoursSchema>;

// Calendar schema
export const calendarDataSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  workingHours: WorkingHoursSchema,
  bufferTime: z.number().int().min(0).default(0),
  timeZone: z.string(),
});

export type CalendarData = z.infer<typeof calendarDataSchema>;
export const calendarSchema = baseEntitySchema.merge(calendarDataSchema);
export type Calendar = z.infer<typeof calendarSchema>;
