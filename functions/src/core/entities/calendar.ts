import z from "zod";
import { baseEntitySchema } from "./base";

export enum OWNER_TYPE {
  MEMBER = "member",
  ORGANIZATION = "organization",
}

// Day of week enum
export enum DAY_OF_WEEK {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

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
  z.nativeEnum(DAY_OF_WEEK),
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
  ownerType: z.nativeEnum(OWNER_TYPE),
  ownerId: z.string(),
  name: z.string(),
  workingHours: WorkingHoursSchema,
  bufferTime: z.number().int().min(0).default(0),
  timeZone: z.string(),
});

export type CalendarData = z.infer<typeof calendarDataSchema>;
export const calendarSchema = baseEntitySchema.merge(calendarDataSchema);
export type Calendar = z.infer<typeof calendarSchema>;
