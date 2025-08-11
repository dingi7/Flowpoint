import z from "zod";
import { baseEntitySchema } from "./base";

export const AssigneeTypeEnum = z.enum(["member", "organization"]);

export const appointmentDataSchema = z.object({
  assigneeType: AssigneeTypeEnum,
  assigneeId: z.string(),
  calendarId: z.string(),
  customerId: z.string(),
  serviceId: z.string(),
  
  title: z.string(),
  description: z.string(),
  organizationId: z.string(),
  startTime: z.string(),
  duration: z.number().int().min(0),
  fee: z.number().optional(),
  status: z.enum(["pending", "completed", "cancelled"]),
});

//   - For org consults, you can still use a Service with price 0 and org-level availability. If you want to support ad-hoc appointments without a service, make serviceId optional and add appointmentType: "service" | "ad_hoc".

export type AppointmentData = z.infer<typeof appointmentDataSchema>;
export const appointmentSchema = baseEntitySchema.merge(appointmentDataSchema);
export type Appointment = z.infer<typeof appointmentSchema>;
