import z from "zod";
import { baseEntitySchema } from "./base";

export enum InviteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export const inviteDataSchema = z.object({
  inviterId: z.string(),
  inviteeEmail: z.string().email(),
  organizationId: z.string(),
  roleIds: z.array(z.string()),
  status: z.nativeEnum(InviteStatus),
  validFor: z.number().default(7).optional(),
});

export type InviteData = z.infer<typeof inviteDataSchema>;
export const inviteSchema = baseEntitySchema.merge(inviteDataSchema);
export type Invite = z.infer<typeof inviteSchema>;
