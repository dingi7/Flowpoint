import z from "zod";
import { baseEntitySchema } from "./base";

export const apiKeyHashDataSchema = z.object({
  secretId: z.string(),
  organizationId: z.string(),
});

export type ApiKeyHashData = z.infer<typeof apiKeyHashDataSchema>;
export const apiKeyHashSchema = baseEntitySchema.merge(apiKeyHashDataSchema);
export type ApiKeyHash = z.infer<typeof apiKeyHashSchema>;

