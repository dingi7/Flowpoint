import z from "zod";
import { baseEntitySchema } from "./base";
import { OWNER_TYPE } from "./calendar";

export enum APPOINTMENT_STATUS {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export const appointmentDataSchema = z.object({
  assigneeType: z.nativeEnum(OWNER_TYPE),
  assigneeId: z.string(),
  customerId: z.string(),
  serviceId: z.string(),

  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  duration: z.number().int().min(0),
  fee: z.number().optional(),
  baseFee: z.number().optional(),
  finalFee: z.number().optional(),
  discountAmount: z.number().optional(),
  pricingRuleId: z.string().optional(),
  pricingSnapshot: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      value: z.number(),
      priority: z.number(),
    })
    .optional(),
  status: z.nativeEnum(APPOINTMENT_STATUS),
});

//   - For org consults, you can still use a Service with price 0 and org-level availability. If you want to support ad-hoc appointments without a service, make serviceId optional and add appointmentType: "service" | "ad_hoc".

export type AppointmentData = z.infer<typeof appointmentDataSchema>;
export const appointmentSchema = baseEntitySchema.merge(appointmentDataSchema);
export type Appointment = z.infer<typeof appointmentSchema>;
