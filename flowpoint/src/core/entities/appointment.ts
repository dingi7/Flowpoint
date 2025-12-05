import z from "zod";
import { baseEntitySchema } from "./base";

export enum ASSIGNEE_TYPE {
  MEMBER = "member",
  ORGANIZATION = "organization",
}

export enum APPOINTMENT_STATUS {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

const appointmentDataBaseSchema = z.object({
  assigneeType: z.nativeEnum(ASSIGNEE_TYPE),
  assigneeId: z.string(),
  customerId: z.string(),
  serviceId: z.string(),

  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  duration: z.number().int().min(0),
  fee: z.number().optional(),
  status: z.nativeEnum(APPOINTMENT_STATUS),
});

export const appointmentDataSchema = appointmentDataBaseSchema
  .refine(
    (data) => {
      // Validate startTime is a valid ISO date string
      try {
        const startDate = new Date(data.startTime);
        return !isNaN(startDate.getTime());
      } catch {
        return false;
      }
    },
    {
      message: "Start time must be a valid date",
      path: ["startTime"],
    },
  )
  .refine(
    (data) => {
      // Validate appointment is not scheduled in the past (except for completed appointments)
      if (data.status === APPOINTMENT_STATUS.COMPLETED) return true;
      try {
        const startDate = new Date(data.startTime);
        const now = new Date();
        return startDate >= now;
      } catch {
        return false;
      }
    },
    {
      message: "Appointment cannot be scheduled in the past",
      path: ["startTime"],
    },
  )
  .refine(
    (data) => {
      // Validate duration is reasonable (between 15 minutes and 8 hours)
      return data.duration >= 15 && data.duration <= 480;
    },
    {
      message: "Duration must be between 15 minutes and 8 hours",
      path: ["duration"],
    },
  )
  .refine(
    (data) => {
      // Validate title is not empty and has reasonable length
      return data.title.trim().length >= 3 && data.title.trim().length <= 200;
    },
    {
      message: "Title must be between 3 and 200 characters",
      path: ["title"],
    },
  )
  .refine(
    (data) => {
      // Validate fee is not negative if provided
      if (data.fee === undefined) return true;
      return data.fee >= 0;
    },
    {
      message: "Fee cannot be negative",
      path: ["fee"],
    },
  )
  .refine(
    (data) => {
      // Validate status transitions (cancelled appointments cannot be pending)
      if (data.status === APPOINTMENT_STATUS.CANCELLED) {
        try {
          const startDate = new Date(data.startTime);
          const now = new Date();
          // Allow cancellation of future appointments or recently past ones (within 24 hours)
          return startDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Cannot cancel appointments that are more than 24 hours in the past",
      path: ["status"],
    },
  );

//   - For org consults, you can still use a Service with price 0 and org-level availability. If you want to support ad-hoc appointments without a service, make serviceId optional and add appointmentType: "service" | "ad_hoc".

export type AppointmentData = z.infer<typeof appointmentDataSchema>;
export const appointmentSchema = baseEntitySchema
  .merge(appointmentDataBaseSchema)
  .refine(
    (data) => {
      // Validate startTime is a valid ISO date string
      try {
        const startDate = new Date(data.startTime);
        return !isNaN(startDate.getTime());
      } catch {
        return false;
      }
    },
    {
      message: "Start time must be a valid date",
      path: ["startTime"],
    },
  )
  .refine(
    (data) => {
      // Validate appointment is not scheduled in the past (except for completed appointments)
      if (data.status === APPOINTMENT_STATUS.COMPLETED) return true;
      try {
        const startDate = new Date(data.startTime);
        const now = new Date();
        return startDate >= now;
      } catch {
        return false;
      }
    },
    {
      message: "Appointment cannot be scheduled in the past",
      path: ["startTime"],
    },
  )
  .refine(
    (data) => {
      // Validate duration is reasonable (between 15 minutes and 8 hours)
      return data.duration >= 15 && data.duration <= 480;
    },
    {
      message: "Duration must be between 15 minutes and 8 hours",
      path: ["duration"],
    },
  )
  .refine(
    (data) => {
      // Validate title is not empty and has reasonable length
      return data.title.trim().length >= 3 && data.title.trim().length <= 200;
    },
    {
      message: "Title must be between 3 and 200 characters",
      path: ["title"],
    },
  )
  .refine(
    (data) => {
      // Validate fee is not negative if provided
      if (data.fee === undefined) return true;
      return data.fee >= 0;
    },
    {
      message: "Fee cannot be negative",
      path: ["fee"],
    },
  )
  .refine(
    (data) => {
      // Validate status transitions (cancelled appointments cannot be pending)
      if (data.status === APPOINTMENT_STATUS.CANCELLED) {
        try {
          const startDate = new Date(data.startTime);
          const now = new Date();
          // Allow cancellation of future appointments or recently past ones (within 24 hours)
          return startDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Cannot cancel appointments that are more than 24 hours in the past",
      path: ["status"],
    },
  );
export type Appointment = z.infer<typeof appointmentSchema>;
