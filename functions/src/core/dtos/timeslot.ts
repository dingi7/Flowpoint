import z from "zod";

export const timeslotSchema = z.object({
  start: z.string(), // ISO datetime string
  end: z.string(), // ISO datetime string
});

export type Timeslot = z.infer<typeof timeslotSchema>;
