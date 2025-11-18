import z from "zod";
import { baseEntitySchema } from "./base";
import { OWNER_TYPE } from "./calendar";

const localeSchema = z.record(z.string(), z.string());

export const serviceDataSchema = z.object({
  organizationId: z.string(),
  ownerType: z.nativeEnum(OWNER_TYPE),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  duration: z.number(),
  image: z.string().optional(),
  order: z.number().optional(),
  localisation: z.object({
    description: localeSchema,
    name: localeSchema,
  }).optional(),
});

export type ServiceData = z.infer<typeof serviceDataSchema>;
export const serviceSchema = baseEntitySchema.merge(serviceDataSchema);
export type Service = z.infer<typeof serviceSchema>;
