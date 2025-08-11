import z from "zod";
import { OwnerTypeEnum } from "./calendar";
import { baseEntitySchema } from "./base";

export const timeOffDataSchema = z.object({
    ownerType: OwnerTypeEnum,
    ownerId: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    reason: z.string(),
    createdBy: z.string(),
})

export type TimeOffData = z.infer<typeof timeOffDataSchema>
export const timeOffSchema = baseEntitySchema.merge(timeOffDataSchema)
export type TimeOff = z.infer<typeof timeOffSchema>