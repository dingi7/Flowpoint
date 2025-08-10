import z from "zod";
import { baseEntitySchema } from "./base";

export const appointmentDataSchema = z.object({
  memberId: z.string(),
  calendarId: z.string(),
  // references Customer.id
  customerId: z.string(),
  title: z.string(),
  description: z.string(),
  organizationId: z.string(),
  startTime: z.string(),
  duration: z.number().int().min(0),
  status: z.enum(["pending", "completed", "cancelled"]),
});

export type AppointmentData = z.infer<typeof appointmentDataSchema>;
export const appointmentSchema = baseEntitySchema.merge(appointmentDataSchema);
export type Appointment = z.infer<typeof appointmentSchema>;