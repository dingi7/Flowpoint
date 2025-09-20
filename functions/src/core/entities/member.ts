import z from "zod";
import { baseEntitySchema } from "./base";

export const memberDataSchema = z.object({
  name: z.string(),
  organizationId: z.string(),
  roleIds: z.array(z.string()),
  image: z.string().optional(),
  description: z.string().optional()
});

export type MemberData = z.infer<typeof memberDataSchema>;
export const memberSchema = baseEntitySchema.merge(memberDataSchema);
export type Member = z.infer<typeof memberSchema>;
