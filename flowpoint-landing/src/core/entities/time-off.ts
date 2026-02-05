import z from "zod";
import { baseEntitySchema } from "./base";
import { OWNER_TYPE } from "./calendar";

export const timeOffDataSchema = z.object({
  ownerType: z.nativeEnum(OWNER_TYPE),
  ownerId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string(),
  createdBy: z.string(),
});

export type TimeOffData = z.infer<typeof timeOffDataSchema>;
export const timeOffSchema = baseEntitySchema.merge(timeOffDataSchema);
export type TimeOff = z.infer<typeof timeOffSchema>;
