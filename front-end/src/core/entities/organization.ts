import z from "zod";
import { baseEntitySchema } from "./base";
import { DayOfWeekEnum } from "./calendar";
import { CustomerFieldConfigSchema } from "./customer";

export const OrganizationSettingsSchema = z.object({
  timezone: z.string().default("UTC"),
  workingDays: z
    .array(DayOfWeekEnum)
    .default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  defaultBufferTime: z.number().int().min(0).default(0), // minutes
  appointmentCancellationPolicyHours: z.number().int().min(0).default(24),
  customerFields: z.array(CustomerFieldConfigSchema).default([]),
});

export const oraganizationDataSchema = z.object({
  name: z.string(),
  image: z.string().optional(),
  industry: z.string().optional(),
  currency: z.string().default("EUR"),
  settings: OrganizationSettingsSchema,
});

export type OrganizationData = z.infer<typeof oraganizationDataSchema>;
export const organizationSchema = baseEntitySchema.merge(
  oraganizationDataSchema,
);
export type Organization = z.infer<typeof organizationSchema>;
