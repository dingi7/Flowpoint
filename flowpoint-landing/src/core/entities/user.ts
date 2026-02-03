import { z } from "zod";
import { baseEntitySchema } from "./base";

export const userDataSchema = z.object({
  email: z.string().email(),
  organizationIds: z.array(z.string()).default([]),
  roles: z.array(z.string()),
});

export type UserData = z.infer<typeof userDataSchema>;
export const userSchema = baseEntitySchema.merge(userDataSchema);
export type User = z.infer<typeof userSchema>;
