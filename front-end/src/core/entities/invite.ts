import z from "zod";
import { baseEntitySchema } from "./base";

export const inviteDataSchema = z.object({
  inviteeEmail: z.string().email(),
  organizationId: z.string(),
  roleIds: z.array(z.string()),
});

export type InviteData = z.infer<typeof inviteDataSchema>;
export const inviteSchema = baseEntitySchema.merge(inviteDataSchema);
export type Invite = z.infer<typeof inviteSchema>;
