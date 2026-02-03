import { z } from "zod";

export const baseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;
