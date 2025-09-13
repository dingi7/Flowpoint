import z from "zod";
import { baseEntitySchema } from "./base";
import { DAY_OF_WEEK } from "./calendar";
import { CustomerFieldConfigSchema } from "./customer";

export const OrganizationSettingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required").default("UTC"),
  workingDays: z
    .array(z.nativeEnum(DAY_OF_WEEK))
    .default([
      DAY_OF_WEEK.MONDAY,
      DAY_OF_WEEK.TUESDAY,
      DAY_OF_WEEK.WEDNESDAY,
      DAY_OF_WEEK.THURSDAY,
      DAY_OF_WEEK.FRIDAY,
    ]),
  defaultBufferTime: z.number().int().min(0).default(0), // minutes
  appointmentCancellationPolicyHours: z.number().int().min(0).default(24),
  customerFields: z.array(CustomerFieldConfigSchema).default([]),
});

export const organizationDataSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  image: z.string().optional(),
  industry: z.string().optional(),
  currency: z.enum(["EUR", "USD", "GBP", "CAD", "AUD"]).default("EUR"),
  settings: OrganizationSettingsSchema,
});

export type OrganizationData = z.infer<typeof organizationDataSchema>;
export const organizationSchema = baseEntitySchema.merge(
  organizationDataSchema,
);
export type Organization = z.infer<typeof organizationSchema>;
