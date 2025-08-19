import z from "zod";
import { baseEntitySchema } from "./base";

export enum ASSIGNEE_TYPE {
  MEMBER = "member",
  ORGANIZATION = "organization",
}

export enum APPOINTMENT_STATUS {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export const appointmentDataSchema = z.object({
  assigneeType: z.nativeEnum(ASSIGNEE_TYPE),
  assigneeId: z.string(),
  customerId: z.string(),
  serviceId: z.string(),

  title: z.string(),
  description: z.string(),
  organizationId: z.string(),
  startTime: z.string(),
  duration: z.number().int().min(0),
  fee: z.number().optional(),
  status: z.nativeEnum(APPOINTMENT_STATUS),
});

//   - For org consults, you can still use a Service with price 0 and org-level availability. If you want to support ad-hoc appointments without a service, make serviceId optional and add appointmentType: "service" | "ad_hoc".

export type AppointmentData = z.infer<typeof appointmentDataSchema>;
export const appointmentSchema = baseEntitySchema.merge(appointmentDataSchema);
export type Appointment = z.infer<typeof appointmentSchema>;
