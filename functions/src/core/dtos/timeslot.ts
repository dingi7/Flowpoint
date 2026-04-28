import z from "zod";

export const timeslotSchema = z.object({
  start: z.string(), // ISO datetime string
  end: z.string(), // ISO datetime string
  basePrice: z.number().optional(),
  finalPrice: z.number().optional(),
  discountAmount: z.number().optional(),
  pricingRuleId: z.string().optional(),
  pricingLabel: z.string().optional(),
});

export type Timeslot = z.infer<typeof timeslotSchema>;
