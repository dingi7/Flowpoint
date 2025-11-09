import z from "zod";
import { baseEntitySchema } from "./base";

export enum PermissionKey {
  MANAGE_MEMBERS = "MANAGE_MEMBERS",
  MANAGE_APPOINTMENTS = "MANAGE_APPOINTMENTS",
  MANAGE_CALENDARS = "MANAGE_CALENDARS",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_ORGANIZATION = "MANAGE_ORGANIZATION",
}

export const roleDataSchema = z.object({
  name: z.string(),
  organizationId: z.string(),
  permissions: z.array(z.nativeEnum(PermissionKey)),
});

export type RoleData = z.infer<typeof roleDataSchema>;
export const roleSchema = baseEntitySchema.merge(roleDataSchema);
export type Role = z.infer<typeof roleSchema>;
