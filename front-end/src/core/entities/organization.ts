import z from "zod";
import { baseEntitySchema } from "./base";
import { DAY_OF_WEEK } from "./calendar";
import { CustomerFieldConfigSchema } from "./customer";

export const OrganizationSettingsSchema = z.object({
  timezone: z.string().default("UTC"),
  workingDays: z
    .array(z.nativeEnum(DAY_OF_WEEK))
    .default([
      DAY_OF_WEEK.MONDAY,
      DAY_OF_WEEK.TUESDAY,
      DAY_OF_WEEK.WEDNESDAY,
      DAY_OF_WEEK.THURSDAY,
      DAY_OF_WEEK.FRIDAY,
    ]),
  workingHours: z.object({
    start: z.string().default("09:00"),
    end: z.string().default("18:00"),
  }),
  defaultBufferTime: z.number().int().min(0).default(0), // minutes
  appointmentCancellationPolicyHours: z.number().int().min(0).default(24),
  customerFields: z.array(CustomerFieldConfigSchema).default([]),
});

export type OrganizationSettingsData = z.infer<typeof OrganizationSettingsSchema>;

export const organizationDataSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters long"),
  image: z.string().optional(),
  industry: z.string().optional(),
  currency: z.string().default("EUR"),
  settings: OrganizationSettingsSchema,
});

export type OrganizationData = z.infer<typeof organizationDataSchema>;
export const organizationSchema = baseEntitySchema.merge(
  organizationDataSchema,
);
export type Organization = z.infer<typeof organizationSchema>;
