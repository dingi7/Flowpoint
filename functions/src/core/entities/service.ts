import z from "zod";
import { baseEntitySchema } from "./base";

export const serviceDataSchema = z.object({
  organizationId: z.string(),

  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  duration: z.number(),
});

export type ServiceData = z.infer<typeof serviceDataSchema>;
export const serviceSchema = baseEntitySchema.merge(serviceDataSchema);
export type Service = z.infer<typeof serviceSchema>;
