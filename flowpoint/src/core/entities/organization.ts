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

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters long")
  .max(63, "Slug must be at most 63 characters long")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Slug can contain only lowercase letters, numbers, and hyphens",
  );

const optionalSlugSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  slugSchema.optional(),
);

export const LandingPageSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  templateId: z.literal("first-class").default("first-class"),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      ogImageUrl: z.string().optional(),
      canonicalHost: z.string().optional(),
    })
    .default({}),
  branding: z
    .object({
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    })
    .default({}),
  hero: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      ctaLabel: z.string().optional(),
      backgroundVideoUrl: z.string().optional(),
      backgroundImageUrl: z.string().optional(),
    })
    .default({}),
  gallery: z
    .object({
      imageUrls: z.array(z.string()).default([]),
    })
    .default({ imageUrls: [] }),
  social: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .default({}),
  location: z
    .object({
      mapEmbedUrl: z.string().optional(),
      sectionTitle: z.string().optional(),
      sectionDescription: z.string().optional(),
    })
    .default({}),
  copyOverrides: z
    .object({
      servicesTitle: z.string().optional(),
      teamTitle: z.string().optional(),
      teamSubtitle: z.string().optional(),
      galleryTitle: z.string().optional(),
    })
    .optional(),
});

export type LandingPageSettings = z.infer<typeof LandingPageSettingsSchema>;

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
  googlePlacesId: z.string().optional(),
  customerFields: z.array(CustomerFieldConfigSchema).default([]),
  contactInfo: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    googleMapsUrl: z.string().optional(),
  }),
  emailTemplates: z
    .object({
      confirmation: EmailTemplateSchema.optional(),
      reminder: EmailTemplateSchema.optional(),
      info: EmailTemplateSchema.optional(),
      review: EmailTemplateSchema.optional(),
      rebooking: EmailTemplateSchema.optional(),
    })
    .optional(),
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
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters long"),
  image: z.string().optional(),
  industry: z.string().optional(),
  currency: z.string().default("EUR"),
  slug: optionalSlugSchema,
  landingPage: LandingPageSettingsSchema.optional(),
  settings: OrganizationSettingsSchema,
  apiKeys: z.array(ApiKeySchema).default([]),
});

export type OrganizationData = z.infer<typeof organizationDataSchema>;
export const organizationSchema = baseEntitySchema.merge(
  organizationDataSchema,
);
export type Organization = z.infer<typeof organizationSchema>;
