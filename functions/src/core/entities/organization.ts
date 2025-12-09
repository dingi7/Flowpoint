import z from "zod";
import { baseEntitySchema } from "./base";
import { DAY_OF_WEEK } from "./calendar";
import { CustomerFieldConfigSchema } from "./customer";

export const EmailTemplateSchema = z.object({
  subject: z.string().default(""),
  html: z.string().default(""),
  text: z.string().default(""),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

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
  appointmentReminderHoursBefore: z.number().int().min(0).default(24),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  customerFields: z.array(CustomerFieldConfigSchema).default([]),
  contactInfo: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    googleMapsUrl: z.string().optional(),
  }),
  emailTemplates: z.object({
    confirmation: EmailTemplateSchema.optional(),
    reminder: EmailTemplateSchema.optional(),
    info: EmailTemplateSchema.optional(),
  }).optional(),
});

export type OrganizationSettingsData = z.infer<
  typeof OrganizationSettingsSchema
>;

export const ApiKeySchema = z.object({
  name: z.string(),
  secretId: z.string(),
  createdAt: z.date(),
  status: z.enum(["active", "revoked"]),
  lastFour: z.string(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

export const organizationDataSchema = z.object({
  name: z.string(),
  image: z.string().optional(),
  industry: z.string().optional(),
  currency: z.string().default("EUR"),
  settings: OrganizationSettingsSchema,
  apiKeys: z.array(ApiKeySchema).default([]),
});

export type OrganizationData = z.infer<typeof organizationDataSchema>;
export const organizationSchema = baseEntitySchema.merge(
  organizationDataSchema,
);
export type Organization = z.infer<typeof organizationSchema>;
